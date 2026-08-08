import { InvalidBirthDateError } from '../../domain/errors/invalid-birth-date.error';
import { InvalidNameError } from '../../domain/errors/invalid-name.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { UserRole } from '../../domain/enums/user-role.enum';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { Password } from '../../domain/value-objects/password.value-object';
import { UserRepository } from '../ports/user-repository.port';
import { UpdateUserProfileUseCase } from './update-user-profile.use-case';

describe('UpdateUserProfileUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: UpdateUserProfileUseCase;

  function buildUser(): User {
    return User.restore({
      id: 'user-id',
      name: 'Jane Doe',
      email: Email.create('jane@example.com'),
      password: Password.fromHash('hashed-password'),
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
      findAll: jest.fn(),
    };
    useCase = new UpdateUserProfileUseCase(userRepository);
  });

  it('updates the name when provided', async () => {
    const user = buildUser();
    userRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute({
      userId: 'user-id',
      name: 'New Name',
    });

    expect(user.getName()).toBe('New Name');
    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(result.user.name).toBe('New Name');
  });

  it('updates the birth date when provided', async () => {
    const user = buildUser();
    userRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute({
      userId: 'user-id',
      birthDate: '1995-05-20',
    });

    expect(user.getBirthDate()?.getValue()).toEqual(new Date('1995-05-20'));
    expect(result.user.birthDate).toEqual(new Date('1995-05-20'));
  });

  it('updates both name and birth date when both are provided', async () => {
    const user = buildUser();
    userRepository.findById.mockResolvedValue(user);

    await useCase.execute({
      userId: 'user-id',
      name: 'New Name',
      birthDate: '1995-05-20',
    });

    expect(user.getName()).toBe('New Name');
    expect(user.getBirthDate()?.getValue()).toEqual(new Date('1995-05-20'));
  });

  it('leaves the user unchanged when neither field is provided', async () => {
    const user = buildUser();
    userRepository.findById.mockResolvedValue(user);

    await useCase.execute({ userId: 'user-id' });

    expect(user.getName()).toBe('Jane Doe');
    expect(user.getBirthDate()).toBeUndefined();
    expect(userRepository.save).toHaveBeenCalledWith(user);
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'missing-id', name: 'New Name' }),
    ).rejects.toThrow(UserNotFoundError);

    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('propagates InvalidNameError for an invalid name', async () => {
    userRepository.findById.mockResolvedValue(buildUser());

    await expect(
      useCase.execute({ userId: 'user-id', name: ' J ' }),
    ).rejects.toThrow(InvalidNameError);

    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('propagates InvalidBirthDateError for a birth date in the future', async () => {
    userRepository.findById.mockResolvedValue(buildUser());

    await expect(
      useCase.execute({ userId: 'user-id', birthDate: '2999-01-01' }),
    ).rejects.toThrow(InvalidBirthDateError);

    expect(userRepository.save).not.toHaveBeenCalled();
  });
});
