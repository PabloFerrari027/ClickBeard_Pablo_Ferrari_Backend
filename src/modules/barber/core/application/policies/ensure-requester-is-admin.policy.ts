import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { ensureRequesterIsAdmin as sharedEnsureRequesterIsAdmin } from '../../../../../shared/application/policies/ensure-requester-is-admin.policy';

import type { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';

export function ensureRequesterIsAdmin(
  userRepository: UserRepository,
  requesterId: string,
): Promise<void> {
  return sharedEnsureRequesterIsAdmin(userRepository, requesterId, {
    notFound: () => new UserNotFoundError(),
    notAdmin: () => new UserIsNotAdminError(),
  });
}
