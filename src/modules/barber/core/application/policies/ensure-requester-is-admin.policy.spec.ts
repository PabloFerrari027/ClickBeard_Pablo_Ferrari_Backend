import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { UserDirectory, UserSnapshot } from '../ports/user-directory.port';
import { ensureRequesterIsAdmin } from './ensure-requester-is-admin.policy';

describe('ensureRequesterIsAdmin', () => {
  let userDirectory: jest.Mocked<UserDirectory>;

  function buildSnapshot(overrides: Partial<UserSnapshot> = {}): UserSnapshot {
    return {
      id: 'requester-id',
      name: 'Admin User',
      role: UserRole.ADMIN,
      active: true,
      ...overrides,
    };
  }

  beforeEach(() => {
    userDirectory = {
      findById: jest.fn(),
    };
  });

  it('resolves without throwing when the requester is an admin', async () => {
    userDirectory.findById.mockResolvedValue(buildSnapshot());

    await expect(
      ensureRequesterIsAdmin(userDirectory, 'requester-id'),
    ).resolves.toBeUndefined();
    expect(userDirectory.findById).toHaveBeenCalledWith('requester-id');
  });

  it('throws UserNotFoundError when the requester does not exist', async () => {
    userDirectory.findById.mockResolvedValue(null);

    await expect(
      ensureRequesterIsAdmin(userDirectory, 'missing-id'),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('throws UserIsNotAdminError when the requester is not an admin', async () => {
    userDirectory.findById.mockResolvedValue(
      buildSnapshot({ role: UserRole.BARBER }),
    );

    await expect(
      ensureRequesterIsAdmin(userDirectory, 'requester-id'),
    ).rejects.toThrow(UserIsNotAdminError);
  });
});
