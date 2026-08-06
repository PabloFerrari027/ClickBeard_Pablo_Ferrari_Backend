import { VerificationNotCompletedError } from '../../domain/errors/verification-not-completed.error';
import { VerificationCode } from '../../domain/entities/verification-code.entity';
import { VerificationCodeRepository } from '../ports/verification-code-repository.port';
import { SessionManager } from '../ports/session-manager.port';
import { CompleteAuthenticationUseCase } from './complete-authentication.use-case';

function buildCode(consumedAt: Date | null): VerificationCode {
  return VerificationCode.restore({
    id: 'code-id',
    userId: 'user-id',
    codeHash: 'hashed-code',
    expiresAt: new Date('2026-01-01T00:10:00.000Z'),
    attempts: 0,
    consumedAt,
    invalidatedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('CompleteAuthenticationUseCase', () => {
  let verificationCodeRepository: jest.Mocked<VerificationCodeRepository>;
  let sessionManager: jest.Mocked<SessionManager>;
  let useCase: CompleteAuthenticationUseCase;

  beforeEach(() => {
    verificationCodeRepository = {
      save: jest.fn(),
      findActiveByUserId: jest.fn(),
      findLatestByUserId: jest.fn(),
      findExpiredActive: jest.fn(),
    };
    sessionManager = {
      createSession: jest.fn(),
    };
    useCase = new CompleteAuthenticationUseCase(
      verificationCodeRepository,
      sessionManager,
    );
  });

  it('creates the session when the latest code was consumed', async () => {
    verificationCodeRepository.findLatestByUserId.mockResolvedValue(
      buildCode(new Date('2026-01-01T00:05:00.000Z')),
    );
    const session = {
      accessToken: 'access-token',
      accessTokenExpiresAt: new Date('2026-01-01T00:15:00.000Z'),
      refreshToken: 'refresh-token',
      refreshTokenExpiresAt: new Date('2026-01-08T00:00:00.000Z'),
    };
    sessionManager.createSession.mockResolvedValue(session);

    const result = await useCase.execute({ userId: 'user-id' });

    expect(sessionManager.createSession).toHaveBeenCalledWith('user-id');
    expect(result).toEqual(session);
  });

  it('throws VerificationNotCompletedError when the latest code was not consumed', async () => {
    verificationCodeRepository.findLatestByUserId.mockResolvedValue(
      buildCode(null),
    );

    await expect(useCase.execute({ userId: 'user-id' })).rejects.toThrow(
      VerificationNotCompletedError,
    );

    expect(sessionManager.createSession).not.toHaveBeenCalled();
  });

  it('throws VerificationNotCompletedError when there is no code at all', async () => {
    verificationCodeRepository.findLatestByUserId.mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'user-id' })).rejects.toThrow(
      VerificationNotCompletedError,
    );
  });
});
