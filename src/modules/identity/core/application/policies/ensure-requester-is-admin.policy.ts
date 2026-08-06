import { UserRole } from '../../domain/enums/user-role.enum';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { UserRepository } from '../ports/user-repository.port';

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
