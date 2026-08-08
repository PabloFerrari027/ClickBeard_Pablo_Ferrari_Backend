import { AuthSessionManager } from './auth-session-manager';
import { UserNotFoundForSessionError } from './errors/user-not-found-for-session.error';
import { User } from '../../../identity/core/domain/entities/user.entity';
import { UserRole } from '../../../identity/core/domain/enums/user-role.enum';
import { Email } from '../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../identity/core/domain/value-objects/password.value-object';

import type { RefreshTokenRepository } from '../../../auth/core/application/ports/refresh-token-repository.port';
import type { TokenProvider } from '../../../auth/core/application/ports/token-provider.port';
import type { UserRepository } from '../../../identity/core/application/ports/user-repository.port';

function buildUser(): User {
  return User.restore({
    id: 'user-1',
    name: 'Jane Doe',
    email: Email.create('jane@example.com'),
    password: Password.fromHash('hashed-password'),
    role: UserRole.CLIENT,
    active: true,
    createdAt: new Date(2026, 0, 1),
    updatedAt: new Date(2026, 0, 1),
  });
}

describe('AuthSessionManager', () => {
  let tokenProvider: jest.Mocked<TokenProvider>;
  let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let sessionManager: AuthSessionManager;

  beforeEach(() => {
    tokenProvider = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
      hashToken: jest.fn(),
    };
    refreshTokenRepository = {
      save: jest.fn(),
      findByTokenHash: jest.fn(),
    };
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
    };
    sessionManager = new AuthSessionManager(
      tokenProvider,
      refreshTokenRepository,
      userRepository,
    );
  });

  it('throws UserNotFoundForSessionError when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(sessionManager.createSession('missing-id')).rejects.toThrow(
      UserNotFoundForSessionError,
    );
    expect(tokenProvider.generateAccessToken).not.toHaveBeenCalled();
  });

  it('generates both tokens using the user id/role and persists the refresh token', async () => {
    const user = buildUser();
    userRepository.findById.mockResolvedValue(user);
    tokenProvider.generateAccessToken.mockResolvedValue({
      token: 'access-token',
      expiresAt: new Date(2026, 0, 2, 0, 15),
    });
    tokenProvider.generateRefreshToken.mockResolvedValue({
      token: 'refresh-token',
      expiresAt: new Date(2026, 0, 8),
    });
    tokenProvider.hashToken.mockResolvedValue('hashed-refresh-token');

    const session = await sessionManager.createSession('user-1');

    expect(tokenProvider.generateAccessToken).toHaveBeenCalledWith({
      subject: 'user-1',
      role: UserRole.CLIENT,
    });
    expect(tokenProvider.generateRefreshToken).toHaveBeenCalledWith({
      subject: 'user-1',
      role: UserRole.CLIENT,
    });
    expect(tokenProvider.hashToken).toHaveBeenCalledWith('refresh-token');

    expect(refreshTokenRepository.save).toHaveBeenCalledTimes(1);
    const savedToken = refreshTokenRepository.save.mock.calls[0][0];
    expect(savedToken.getUserId()).toBe('user-1');
    expect(savedToken.getTokenHash()).toBe('hashed-refresh-token');

    expect(session).toEqual({
      accessToken: 'access-token',
      accessTokenExpiresAt: new Date(2026, 0, 2, 0, 15),
      refreshToken: 'refresh-token',
      refreshTokenExpiresAt: new Date(2026, 0, 8),
    });
  });
});
