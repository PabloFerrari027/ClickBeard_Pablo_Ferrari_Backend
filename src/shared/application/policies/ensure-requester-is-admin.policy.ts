import { UserRole } from '../../../modules/identity/core/domain/enums/user-role.enum';

import type { UserRepository } from '../../../modules/identity/core/application/ports/user-repository.port';

export interface EnsureRequesterIsAdminErrors {
  notFound: () => Error;
  notAdmin: () => Error;
}

/**
 * The "find requester, confirm they exist, confirm they're ADMIN" check
 * every module's own `ensureRequesterIsAdmin` policy repeated
 * byte-for-byte. Centralized here since the control flow never varies
 * — only the module's own error identity does, which callers still
 * fully control by passing their own error constructors, so the
 * HTTP status/`error.name` a caller sees back is unchanged.
 */
export async function ensureRequesterIsAdmin(
  userRepository: UserRepository,
  requesterId: string,
  errors: EnsureRequesterIsAdminErrors,
): Promise<void> {
  const requester = await userRepository.findById(requesterId);

  if (!requester) {
    throw errors.notFound();
  }

  if (requester.getRole() !== UserRole.ADMIN) {
    throw errors.notAdmin();
  }
}
