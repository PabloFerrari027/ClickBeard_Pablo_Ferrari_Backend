import { InvalidRefreshTokenError } from '../../domain/errors/invalid-refresh-token.error';
import { RefreshTokenExpiredError } from '../../domain/errors/refresh-token-expired.error';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { RefreshTokenRepository } from '../ports/refresh-token-repository.port';
import { TokenPayload, TokenProvider } from '../ports/token-provider.port';
import { AuthUserSnapshot, UserDirectory } from '../ports/user-directory.port';
import { RefreshTokenUseCase } from './refresh-token.use-case';

function buildStoredToken(
  overrides: Partial<{
    userId: string;
    expiresAt: Date;
    revokedAt: Date | null;
  }> = {},
): RefreshToken {
  return RefreshToken.restore({
    id: 'stored-token-id',
    userId: overrides.userId ?? 'user-id',
    tokenHash: 'hashed-refresh-token',
    expiresAt: overrides.expiresAt ?? new Date('2099-01-08T00:00:00.000Z'),
    revokedAt: overrides.revokedAt ?? null,
    replacedByTokenId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function buildPayload(overrides: Partial<TokenPayload> = {}): TokenPayload {
  return { subject: 'user-id', role: 'CLIENT', ...overrides };
}

function buildSnapshot(
  overrides: Partial<AuthUserSnapshot> = {},
): AuthUserSnapshot {
  return {
    id: 'user-id',
    name: 'Jane Doe',
    email: 'jane@example.com',
    passwordHash: 'hashed-password',
    role: 'CLIENT',
    active: true,
    ...overrides,
  };
}

describe('RefreshTokenUseCase', () => {
  let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;
  let tokenProvider: jest.Mocked<TokenProvider>;
  let userDirectory: jest.Mocked<UserDirectory>;
  let useCase: RefreshTokenUseCase;

  beforeEach(() => {
    refreshTokenRepository = {
      save: jest.fn(),
      findByTokenHash: jest.fn(),
    };
    tokenProvider = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
      hashToken: jest.fn(),
    };
    userDirectory = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };
    useCase = new RefreshTokenUseCase(
      refreshTokenRepository,
      tokenProvider,
      userDirectory,
    );

    tokenProvider.hashToken.mockResolvedValue('hashed-refresh-token');
  });

  it('rotates the refresh token and returns a new token pair', async () => {
    const storedToken = buildStoredToken();
    tokenProvider.verifyRefreshToken.mockResolvedValue(buildPayload());
    refreshTokenRepository.findByTokenHash.mockResolvedValue(storedToken);
    userDirectory.findById.mockResolvedValue(buildSnapshot());
    tokenProvider.generateAccessToken.mockResolvedValue({
      token: 'new-access-token',
      expiresAt: new Date('2026-01-01T00:15:00.000Z'),
    });
    tokenProvider.generateRefreshToken.mockResolvedValue({
      token: 'new-refresh-token',
      expiresAt: new Date('2026-01-08T00:00:00.000Z'),
    });

    const result = await useCase.execute({ refreshToken: 'refresh-token' });

    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token');
    expect(storedToken.isRevoked()).toBe(true);
    expect(storedToken.getReplacedByTokenId()).toBeTruthy();
    expect(refreshTokenRepository.save).toHaveBeenCalledTimes(2);
    expect(refreshTokenRepository.save).toHaveBeenNthCalledWith(1, storedToken);
  });

  it('throws InvalidRefreshTokenError when the token signature is invalid', async () => {
    tokenProvider.verifyRefreshToken.mockResolvedValue(null);

    await expect(
      useCase.execute({ refreshToken: 'bad-token' }),
    ).rejects.toThrow(InvalidRefreshTokenError);

    expect(refreshTokenRepository.findByTokenHash).not.toHaveBeenCalled();
  });

  it('throws InvalidRefreshTokenError when no stored token matches the hash', async () => {
    tokenProvider.verifyRefreshToken.mockResolvedValue(buildPayload());
    refreshTokenRepository.findByTokenHash.mockResolvedValue(null);

    await expect(
      useCase.execute({ refreshToken: 'refresh-token' }),
    ).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('throws InvalidRefreshTokenError when the stored token belongs to another user', async () => {
    tokenProvider.verifyRefreshToken.mockResolvedValue(
      buildPayload({ subject: 'someone-else' }),
    );
    refreshTokenRepository.findByTokenHash.mockResolvedValue(
      buildStoredToken(),
    );

    await expect(
      useCase.execute({ refreshToken: 'refresh-token' }),
    ).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('throws InvalidRefreshTokenError when the stored token was already revoked', async () => {
    tokenProvider.verifyRefreshToken.mockResolvedValue(buildPayload());
    refreshTokenRepository.findByTokenHash.mockResolvedValue(
      buildStoredToken({ revokedAt: new Date('2026-01-02T00:00:00.000Z') }),
    );

    await expect(
      useCase.execute({ refreshToken: 'refresh-token' }),
    ).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('throws RefreshTokenExpiredError when the stored token has expired', async () => {
    tokenProvider.verifyRefreshToken.mockResolvedValue(buildPayload());
    refreshTokenRepository.findByTokenHash.mockResolvedValue(
      buildStoredToken({ expiresAt: new Date('2020-01-01T00:00:00.000Z') }),
    );

    await expect(
      useCase.execute({ refreshToken: 'refresh-token' }),
    ).rejects.toThrow(RefreshTokenExpiredError);
  });

  it('throws InvalidRefreshTokenError when the user no longer exists or is inactive', async () => {
    tokenProvider.verifyRefreshToken.mockResolvedValue(buildPayload());
    refreshTokenRepository.findByTokenHash.mockResolvedValue(
      buildStoredToken(),
    );
    userDirectory.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ refreshToken: 'refresh-token' }),
    ).rejects.toThrow(InvalidRefreshTokenError);
  });
});
