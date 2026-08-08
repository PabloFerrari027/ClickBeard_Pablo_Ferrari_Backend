import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { ensureRequesterIsAdmin } from './ensure-requester-is-admin.policy';

function buildUser(role: UserRole): User {
  return User.restore({
    id: 'requester-id',
    name: 'Admin User',
    email: Email.create('requester-id@example.com'),
    password: Password.fromHash('hashed-password'),
    role,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('ensureRequesterIsAdmin', () => {
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
    };
  });

  it('resolves without throwing when the requester is an admin', async () => {
    userRepository.findById.mockResolvedValue(buildUser(UserRole.ADMIN));

    await expect(
      ensureRequesterIsAdmin(userRepository, 'requester-id'),
    ).resolves.toBeUndefined();
    expect(userRepository.findById).toHaveBeenCalledWith('requester-id');
  });

  it('throws UserNotFoundError when the requester does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      ensureRequesterIsAdmin(userRepository, 'missing-id'),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('throws UserIsNotAdminError when the requester is not an admin', async () => {
    userRepository.findById.mockResolvedValue(buildUser(UserRole.CLIENT));

    await expect(
      ensureRequesterIsAdmin(userRepository, 'requester-id'),
    ).rejects.toThrow(UserIsNotAdminError);
  });
});
