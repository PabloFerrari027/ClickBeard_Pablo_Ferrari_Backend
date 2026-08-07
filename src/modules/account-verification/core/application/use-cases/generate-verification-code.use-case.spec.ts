import { PasswordHasher } from '../../../../identity/core/application/ports/password-hasher.port';
import { VerificationCode } from '../../domain/entities/verification-code.entity';
import { VerificationCodeRepository } from '../ports/verification-code-repository.port';
import { VerificationCodeGenerator } from '../ports/verification-code-generator.port';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { GenerateVerificationCodeUseCase } from './generate-verification-code.use-case';

describe('GenerateVerificationCodeUseCase', () => {
  let verificationCodeRepository: jest.Mocked<VerificationCodeRepository>;
  let verificationCodeGenerator: jest.Mocked<VerificationCodeGenerator>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let eventBus: jest.Mocked<EventBus>;
  let useCase: GenerateVerificationCodeUseCase;

  const now = new Date('2026-01-01T00:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);

    verificationCodeRepository = {
      save: jest.fn(),
      findActiveByUserId: jest.fn(),
      findLatestByUserId: jest.fn(),
      findExpiredActive: jest.fn(),
    };
    verificationCodeGenerator = {
      generate: jest.fn(),
    };
    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    eventBus = {
      publish: jest.fn(),
    };
    useCase = new GenerateVerificationCodeUseCase(
      verificationCodeRepository,
      verificationCodeGenerator,
      passwordHasher,
      eventBus,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a new code, saves it and publishes VerificationCodeGenerated with the raw code', async () => {
    verificationCodeRepository.findActiveByUserId.mockResolvedValue(null);
    verificationCodeGenerator.generate.mockResolvedValue('123456');
    passwordHasher.hash.mockResolvedValue('hashed-code');

    const result = await useCase.execute({
      userId: 'user-id',
      email: 'jane@example.com',
      name: 'Jane Doe',
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith('123456');
    expect(verificationCodeRepository.save).toHaveBeenCalledTimes(1);

    const savedCode = verificationCodeRepository.save.mock.calls[0][0];
    expect(savedCode.getUserId()).toBe('user-id');
    expect(savedCode.getCodeHash()).toBe('hashed-code');
    expect(result.verificationCodeId).toBe(savedCode.getId());
    expect(result.expiresAt).toEqual(savedCode.getExpiresAt());

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = eventBus.publish.mock.calls[0][0];
    expect(publishedEvent.name).toBe('VerificationCodeGenerated');
    expect(publishedEvent.recipientEmail).toBe('jane@example.com');
    expect(publishedEvent.payload).toEqual({
      name: 'Jane Doe',
      code: '123456',
    });
  });

  it('invalidates any existing active code before creating a new one', async () => {
    const existingCode = VerificationCode.restore({
      id: 'existing-id',
      userId: 'user-id',
      codeHash: 'old-hash',
      expiresAt: new Date('2026-01-01T00:10:00.000Z'),
      attempts: 0,
      consumedAt: null,
      invalidatedAt: null,
      createdAt: new Date('2025-12-31T23:50:00.000Z'),
    });
    verificationCodeRepository.findActiveByUserId.mockResolvedValue(
      existingCode,
    );
    verificationCodeGenerator.generate.mockResolvedValue('654321');
    passwordHasher.hash.mockResolvedValue('new-hash');

    await useCase.execute({
      userId: 'user-id',
      email: 'jane@example.com',
      name: 'Jane Doe',
    });

    expect(existingCode.isInvalidated()).toBe(true);
    expect(verificationCodeRepository.save).toHaveBeenCalledTimes(2);
    expect(verificationCodeRepository.save).toHaveBeenNthCalledWith(
      1,
      existingCode,
    );
  });
});
