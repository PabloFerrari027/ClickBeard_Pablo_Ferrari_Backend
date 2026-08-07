import { VerificationCode } from '../../domain/entities/verification-code.entity';
import { VerificationCodeRepository } from '../ports/verification-code-repository.port';
import { InvalidateExpiredVerificationCodesUseCase } from './invalidate-expired-verification-codes.use-case';

describe('InvalidateExpiredVerificationCodesUseCase', () => {
  let verificationCodeRepository: jest.Mocked<VerificationCodeRepository>;
  let useCase: InvalidateExpiredVerificationCodesUseCase;

  const now = new Date('2026-01-01T00:20:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);

    verificationCodeRepository = {
      save: jest.fn(),
      findActiveByUserId: jest.fn(),
      findLatestByUserId: jest.fn(),
      findExpiredActive: jest.fn(),
    };
    useCase = new InvalidateExpiredVerificationCodesUseCase(
      verificationCodeRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('invalidates every expired code returned by the repository', async () => {
    const codeA = VerificationCode.restore({
      id: 'a',
      userId: 'user-a',
      codeHash: 'hash-a',
      expiresAt: new Date('2026-01-01T00:10:00.000Z'),
      attempts: 0,
      consumedAt: null,
      invalidatedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const codeB = VerificationCode.restore({
      id: 'b',
      userId: 'user-b',
      codeHash: 'hash-b',
      expiresAt: new Date('2026-01-01T00:05:00.000Z'),
      attempts: 0,
      consumedAt: null,
      invalidatedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    verificationCodeRepository.findExpiredActive.mockResolvedValue([
      codeA,
      codeB,
    ]);

    const result = await useCase.execute();

    expect(verificationCodeRepository.findExpiredActive).toHaveBeenCalledWith(
      now,
    );
    expect(codeA.isInvalidated()).toBe(true);
    expect(codeB.isInvalidated()).toBe(true);
    expect(verificationCodeRepository.save).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ invalidatedCount: 2 });
  });

  it('returns zero when there are no expired codes', async () => {
    verificationCodeRepository.findExpiredActive.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(verificationCodeRepository.save).not.toHaveBeenCalled();
    expect(result).toEqual({ invalidatedCount: 0 });
  });
});
