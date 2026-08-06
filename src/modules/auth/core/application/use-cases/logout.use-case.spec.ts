import { InvalidRefreshTokenError } from '../../domain/errors/invalid-refresh-token.error';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { RefreshTokenRepository } from '../ports/refresh-token-repository.port';
import { TokenProvider } from '../ports/token-provider.port';
import { LogoutUseCase } from './logout.use-case';

function buildStoredToken(revokedAt: Date | null = null): RefreshToken {
  return RefreshToken.restore({
    id: 'stored-token-id',
    userId: 'user-id',
    tokenHash: 'hashed-refresh-token',
    expiresAt: new Date('2026-01-08T00:00:00.000Z'),
    revokedAt,
    replacedByTokenId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('LogoutUseCase', () => {
  let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;
  let tokenProvider: jest.Mocked<TokenProvider>;
  let useCase: LogoutUseCase;

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
    useCase = new LogoutUseCase(refreshTokenRepository, tokenProvider);

    tokenProvider.hashToken.mockResolvedValue('hashed-refresh-token');
  });

  it('revokes the stored refresh token matching the given raw token', async () => {
    const storedToken = buildStoredToken();
    refreshTokenRepository.findByTokenHash.mockResolvedValue(storedToken);

    const result = await useCase.execute({ refreshToken: 'refresh-token' });

    expect(tokenProvider.hashToken).toHaveBeenCalledWith('refresh-token');
    expect(storedToken.isRevoked()).toBe(true);
    expect(refreshTokenRepository.save).toHaveBeenCalledWith(storedToken);
    expect(result).toEqual({ loggedOut: true });
  });

  it('is idempotent when the token was already revoked', async () => {
    refreshTokenRepository.findByTokenHash.mockResolvedValue(
      buildStoredToken(new Date('2026-01-02T00:00:00.000Z')),
    );

    const result = await useCase.execute({ refreshToken: 'refresh-token' });

    expect(refreshTokenRepository.save).not.toHaveBeenCalled();
    expect(result).toEqual({ loggedOut: true });
  });

  it('throws InvalidRefreshTokenError when no stored token matches', async () => {
    refreshTokenRepository.findByTokenHash.mockResolvedValue(null);

    await expect(
      useCase.execute({ refreshToken: 'unknown-token' }),
    ).rejects.toThrow(InvalidRefreshTokenError);
  });
});
