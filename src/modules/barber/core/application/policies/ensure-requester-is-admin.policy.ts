import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';

export async function ensureRequesterIsAdmin(
  userRepository: UserRepository,
  requesterId: string,
): Promise<void> {
  const requester = await userRepository.findById(requesterId);

  if (!requester) {
    throw new UserNotFoundError();
  }

  if (requester.getRole() !== UserRole.ADMIN) {
    throw new UserIsNotAdminError();
  }
}
