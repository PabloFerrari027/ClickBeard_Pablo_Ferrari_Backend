import { AdminCannotBeDeactivatedError } from '../../domain/errors/admin-cannot-be-deactivated.error';
import { UserAlreadyDeactivatedError } from '../../domain/errors/user-already-deactivated.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { UserRole } from '../../domain/enums/user-role.enum';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { Password } from '../../domain/value-objects/password.value-object';
import { UserRepository } from '../ports/user-repository.port';
import { DeactivateUserUseCase } from './deactivate-user.use-case';

describe('DeactivateUserUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: DeactivateUserUseCase;

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

  beforeEach(() => {
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    useCase = new DeactivateUserUseCase(userRepository);
  });

  it('deactivates an active, non-admin user and returns the updated dto', async () => {
    const user = buildUser({ active: true });
    userRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute({ userId: 'user-id' });

    expect(user.isActive()).toBe(false);
    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(result.user.active).toBe(false);
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'missing-id' })).rejects.toThrow(
      UserNotFoundError,
    );

    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('propagates AdminCannotBeDeactivatedError for an admin user', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser({ role: UserRole.ADMIN, active: true }),
    );

    await expect(useCase.execute({ userId: 'user-id' })).rejects.toThrow(
      AdminCannotBeDeactivatedError,
    );

    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('propagates UserAlreadyDeactivatedError when the user is already inactive', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser({ role: UserRole.CLIENT, active: false }),
    );

    await expect(useCase.execute({ userId: 'user-id' })).rejects.toThrow(
      UserAlreadyDeactivatedError,
    );

    expect(userRepository.save).not.toHaveBeenCalled();
  });
});
