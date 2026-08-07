import { PasswordHasher } from '../../../../identity/core/application/ports/password-hasher.port';
import { InvalidVerificationCodeError } from '../../domain/errors/invalid-verification-code.error';
import { VerificationCodeAttemptsExceededError } from '../../domain/errors/verification-code-attempts-exceeded.error';
import { VerificationCodeExpiredError } from '../../domain/errors/verification-code-expired.error';
import { VerificationCodeNotFoundError } from '../../domain/errors/verification-code-not-found.error';
import {
  VerificationCode,
  VerificationCodeProps,
} from '../../domain/entities/verification-code.entity';
import { VerificationCodeRepository } from '../ports/verification-code-repository.port';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { ValidateVerificationCodeUseCase } from './validate-verification-code.use-case';

function buildCode(
  overrides: Partial<VerificationCodeProps> = {},
): VerificationCode {
  return VerificationCode.restore({
    id: 'code-id',
    userId: 'user-id',
    codeHash: 'hashed-code',
    expiresAt: new Date('2026-01-01T00:10:00.000Z'),
    attempts: 0,
    consumedAt: null,
    invalidatedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

describe('ValidateVerificationCodeUseCase', () => {
  let verificationCodeRepository: jest.Mocked<VerificationCodeRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let eventBus: jest.Mocked<EventBus>;
  let useCase: ValidateVerificationCodeUseCase;

  const now = new Date('2026-01-01T00:05:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);

    verificationCodeRepository = {
      save: jest.fn(),
      findActiveByUserId: jest.fn(),
      findLatestByUserId: jest.fn(),
      findExpiredActive: jest.fn(),
    };
    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    eventBus = {
      publish: jest.fn(),
    };
    useCase = new ValidateVerificationCodeUseCase(
      verificationCodeRepository,
      passwordHasher,
      eventBus,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('consumes the code and publishes VerificationSucceeded when the code is correct', async () => {
    const code = buildCode();
    verificationCodeRepository.findActiveByUserId.mockResolvedValue(code);
    passwordHasher.compare.mockResolvedValue(true);

    const result = await useCase.execute({ userId: 'user-id', code: '123456' });

    expect(code.isConsumed()).toBe(true);
    expect(verificationCodeRepository.save).toHaveBeenCalledWith(code);
    expect(result).toEqual({ verified: true });

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(eventBus.publish.mock.calls[0][0].name).toBe(
      'VerificationSucceeded',
    );
  });

  it('throws VerificationCodeNotFoundError and publishes VerificationFailed when there is no active code', async () => {
    verificationCodeRepository.findActiveByUserId.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'user-id', code: '123456' }),
    ).rejects.toThrow(VerificationCodeNotFoundError);

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = eventBus.publish.mock.calls[0][0];
    expect(publishedEvent.name).toBe('VerificationFailed');
    expect(publishedEvent.payload).toEqual({
      userId: 'user-id',
      reason: 'not_found',
    });
  });

  it('throws VerificationCodeAttemptsExceededError when attempts are exhausted', async () => {
    verificationCodeRepository.findActiveByUserId.mockResolvedValue(
      buildCode({ attempts: 5 }),
    );

    await expect(
      useCase.execute({ userId: 'user-id', code: '123456' }),
    ).rejects.toThrow(VerificationCodeAttemptsExceededError);

    expect(passwordHasher.compare).not.toHaveBeenCalled();
  });

  it('throws VerificationCodeExpiredError when the code has expired', async () => {
    verificationCodeRepository.findActiveByUserId.mockResolvedValue(
      buildCode({ expiresAt: new Date('2026-01-01T00:01:00.000Z') }),
    );

    await expect(
      useCase.execute({ userId: 'user-id', code: '123456' }),
    ).rejects.toThrow(VerificationCodeExpiredError);

    expect(passwordHasher.compare).not.toHaveBeenCalled();
  });

  it('records a failed attempt, saves and throws InvalidVerificationCodeError when the code is wrong', async () => {
    const code = buildCode();
    verificationCodeRepository.findActiveByUserId.mockResolvedValue(code);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ userId: 'user-id', code: 'wrong-code' }),
    ).rejects.toThrow(InvalidVerificationCodeError);

    expect(code.getAttempts()).toBe(1);
    expect(verificationCodeRepository.save).toHaveBeenCalledWith(code);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(eventBus.publish.mock.calls[0][0].payload).toEqual({
      userId: 'user-id',
      reason: 'invalid_code',
    });
  });
});
