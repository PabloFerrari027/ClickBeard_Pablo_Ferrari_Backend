import { ExecutionContext, ForbiddenException } from '@nestjs/common';

import { UserRole } from '../../../identity/core/domain/enums/user-role.enum';
import { SelfOrAdminGuard } from './self-or-admin.guard';

function buildContext(
  userId: string,
  role: UserRole,
  paramId: string,
): ExecutionContext {
  const request = { user: { id: userId, role }, params: { id: paramId } };

  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('SelfOrAdminGuard', () => {
  let guard: SelfOrAdminGuard;

  beforeEach(() => {
    guard = new SelfOrAdminGuard();
  });

  it('allows access when the user acts on their own account', () => {
    const context = buildContext('user-id', UserRole.CLIENT, 'user-id');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access when the user is an admin acting on someone else', () => {
    const context = buildContext('admin-id', UserRole.ADMIN, 'other-id');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException when a non-admin acts on someone else', () => {
    const context = buildContext('user-id', UserRole.CLIENT, 'other-id');

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
