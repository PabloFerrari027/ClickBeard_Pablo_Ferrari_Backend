import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { UserDirectory } from '../ports/user-directory.port';

export async function ensureRequesterIsAdmin(
  userDirectory: UserDirectory,
  requesterId: string,
): Promise<void> {
  const requester = await userDirectory.findById(requesterId);

  if (!requester) {
    throw new UserNotFoundError();
  }

  if (requester.role !== (UserRole.ADMIN as string)) {
    throw new UserIsNotAdminError();
  }
}
