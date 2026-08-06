import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRole } from '../../../identity/core/domain/enums/user-role.enum';
import { RolesGuard } from './roles.guard';

function buildContext(role: UserRole): ExecutionContext {
  const request = { user: { id: 'user-id', role } };

  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: jest.Mocked<Reflector>;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles metadata is set', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(buildContext(UserRole.CLIENT))).toBe(true);
  });

  it('allows access when the roles metadata is an empty array', () => {
    reflector.getAllAndOverride.mockReturnValue([]);

    expect(guard.canActivate(buildContext(UserRole.CLIENT))).toBe(true);
  });

  it('allows access when the user has one of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(guard.canActivate(buildContext(UserRole.ADMIN))).toBe(true);
  });

  it('throws ForbiddenException when the user lacks the required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(() => guard.canActivate(buildContext(UserRole.CLIENT))).toThrow(
      ForbiddenException,
    );
  });

  it('allows access when the user has one of several required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([
      UserRole.ADMIN,
      UserRole.BARBER,
    ]);

    expect(guard.canActivate(buildContext(UserRole.BARBER))).toBe(true);
  });
});
