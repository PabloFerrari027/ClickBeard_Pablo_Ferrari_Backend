import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { UserRepository } from '../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../identity/core/domain/value-objects/password.value-object';
import { TokenProvider } from '../../core/application/ports/token-provider.port';
import { AccessTokenGuard } from './access-token.guard';

function buildUser(
  overrides: { role?: UserRole; active?: boolean } = {},
): User {
  return User.restore({
    id: 'user-id',
    name: 'Jane Doe',
    email: Email.create('jane@example.com'),
    password: Password.fromHash('hashed-password'),
    role: overrides.role ?? UserRole.CLIENT,
    active: overrides.active ?? true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function buildContext(authorizationHeader?: string): {
  context: ExecutionContext;
  request: { headers: Record<string, string>; user?: unknown };
} {
  const request = {
    headers: authorizationHeader ? { authorization: authorizationHeader } : {},
  } as { headers: Record<string, string>; user?: unknown };

  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;

  return { context, request };
}

describe('AccessTokenGuard', () => {
  let tokenProvider: jest.Mocked<TokenProvider>;
  let userRepository: jest.Mocked<UserRepository>;
  let guard: AccessTokenGuard;

  beforeEach(() => {
    tokenProvider = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
      hashToken: jest.fn(),
    };
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    guard = new AccessTokenGuard(tokenProvider, userRepository);
  });

  it('attaches the fresh user id/role to the request for a valid token', async () => {
    const { context, request } = buildContext('Bearer valid-token');
    tokenProvider.verifyAccessToken.mockResolvedValue({
      subject: 'user-id',
      role: 'CLIENT',
    });
    userRepository.findById.mockResolvedValue(
      buildUser({ role: UserRole.ADMIN }),
    );

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual({ id: 'user-id', role: UserRole.ADMIN });
  });

  it('throws UnauthorizedException when the header is missing', async () => {
    const { context } = buildContext();

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(tokenProvider.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when the header is not a Bearer token', async () => {
    const { context } = buildContext('Basic abc123');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when the token is invalid or expired', async () => {
    const { context } = buildContext('Bearer bad-token');
    tokenProvider.verifyAccessToken.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(userRepository.findById).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when the user no longer exists', async () => {
    const { context } = buildContext('Bearer valid-token');
    tokenProvider.verifyAccessToken.mockResolvedValue({
      subject: 'missing-id',
      role: 'CLIENT',
    });
    userRepository.findById.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when the user is deactivated', async () => {
    const { context } = buildContext('Bearer valid-token');
    tokenProvider.verifyAccessToken.mockResolvedValue({
      subject: 'user-id',
      role: 'CLIENT',
    });
    userRepository.findById.mockResolvedValue(buildUser({ active: false }));

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
