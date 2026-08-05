import { UserAlreadyActiveError } from '../../domain/errors/user-already-active.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { UserRole } from '../../domain/enums/user-role.enum';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { Password } from '../../domain/value-objects/password.value-object';
import { UserRepository } from '../ports/user-repository.port';
import { ActivateUserUseCase } from './activate-user.use-case';

describe('ActivateUserUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: ActivateUserUseCase;

  function buildUser(active: boolean): User {
    return User.restore({
      id: 'user-id',
      name: 'Jane Doe',
      email: Email.create('jane@example.com'),
      password: Password.fromHash('hashed-password'),
      role: UserRole.CLIENT,
      active,
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
    useCase = new ActivateUserUseCase(userRepository);
  });

  it('activates an inactive user and returns the updated dto', async () => {
    const user = buildUser(false);
    userRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute({ userId: 'user-id' });

    expect(user.isActive()).toBe(true);
    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(result.user.active).toBe(true);
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'missing-id' })).rejects.toThrow(
      UserNotFoundError,
    );

    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('propagates UserAlreadyActiveError when the user is already active', async () => {
    userRepository.findById.mockResolvedValue(buildUser(true));

    await expect(useCase.execute({ userId: 'user-id' })).rejects.toThrow(
      UserAlreadyActiveError,
    );

    expect(userRepository.save).not.toHaveBeenCalled();
  });
});
