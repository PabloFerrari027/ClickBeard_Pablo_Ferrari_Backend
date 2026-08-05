import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { SamePasswordError } from '../../domain/errors/same-password.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { WeakPasswordError } from '../../domain/errors/weak-password.error';
import { UserRole } from '../../domain/enums/user-role.enum';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { Password } from '../../domain/value-objects/password.value-object';
import { PasswordHasher } from '../ports/password-hasher.port';
import { UserRepository } from '../ports/user-repository.port';
import { ChangePasswordUseCase } from './change-password.use-case';

describe('ChangePasswordUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let useCase: ChangePasswordUseCase;

  function buildUser(): User {
    return User.restore({
      id: 'user-id',
      name: 'Jane Doe',
      email: Email.create('jane@example.com'),
      password: Password.fromHash('current-hashed-password'),
      role: UserRole.CLIENT,
      active: true,
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
    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    useCase = new ChangePasswordUseCase(userRepository, passwordHasher);
  });

  it('changes the password when the current password is valid and the new one is different', async () => {
    const user = buildUser();
    userRepository.findById.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(true);
    passwordHasher.hash.mockResolvedValue('new-hashed-password');

    await useCase.execute({
      userId: 'user-id',
      currentPassword: 'current-password',
      newPassword: 'new-password1',
    });

    expect(passwordHasher.compare).toHaveBeenCalledWith(
      'current-password',
      'current-hashed-password',
    );
    expect(passwordHasher.hash).toHaveBeenCalledWith('new-password1');
    expect(user.getPassword().getHash()).toBe('new-hashed-password');
    expect(userRepository.save).toHaveBeenCalledWith(user);
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'missing-id',
        currentPassword: 'current-password',
        newPassword: 'new-password1',
      }),
    ).rejects.toThrow(UserNotFoundError);

    expect(passwordHasher.compare).not.toHaveBeenCalled();
  });

  it('throws InvalidCredentialsError when the current password is wrong', async () => {
    userRepository.findById.mockResolvedValue(buildUser());
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: 'user-id',
        currentPassword: 'wrong-password',
        newPassword: 'new-password1',
      }),
    ).rejects.toThrow(InvalidCredentialsError);

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('propagates WeakPasswordError when the new password does not meet the policy', async () => {
    userRepository.findById.mockResolvedValue(buildUser());
    passwordHasher.compare.mockResolvedValue(true);

    await expect(
      useCase.execute({
        userId: 'user-id',
        currentPassword: 'current-password',
        newPassword: 'weak',
      }),
    ).rejects.toThrow(WeakPasswordError);

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('propagates SamePasswordError when the new password hashes the same as the current one', async () => {
    userRepository.findById.mockResolvedValue(buildUser());
    passwordHasher.compare.mockResolvedValue(true);
    passwordHasher.hash.mockResolvedValue('current-hashed-password');

    await expect(
      useCase.execute({
        userId: 'user-id',
        currentPassword: 'current-password',
        newPassword: 'current-password1',
      }),
    ).rejects.toThrow(SamePasswordError);

    expect(userRepository.save).not.toHaveBeenCalled();
  });
});
