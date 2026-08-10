import { InvalidBirthDateError } from '../../domain/errors/invalid-birth-date.error';
import { InvalidNameError } from '../../domain/errors/invalid-name.error';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error';
import { WeakPasswordError } from '../../domain/errors/weak-password.error';
import { UserRole } from '../../domain/enums/user-role.enum';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { Password } from '../../domain/value-objects/password.value-object';
import { PasswordHasher } from '../ports/password-hasher.port';
import { UserRepository } from '../ports/user-repository.port';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { RegisterUserUseCase } from './register-user.use-case';

describe('RegisterUserUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let eventBus: jest.Mocked<EventBus>;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
    };
    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    eventBus = {
      publish: jest.fn(),
    };
    useCase = new RegisterUserUseCase(userRepository, passwordHasher, eventBus);
  });

  it('registers a new user with the default CLIENT role', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('hashed-password');

    const result = await useCase.execute({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password1',
    });

    expect(userRepository.findByEmail).toHaveBeenCalledWith('jane@example.com');
    expect(passwordHasher.hash).toHaveBeenCalledWith('password1');
    expect(userRepository.save).toHaveBeenCalledTimes(1);

    const savedUser = userRepository.save.mock.calls[0][0];
    expect(savedUser.getRole()).toBe(UserRole.CLIENT);
    expect(savedUser.getPassword().getHash()).toBe('hashed-password');
    expect(savedUser.getBirthDate()).toBeUndefined();

    expect(result.user).toEqual({
      id: savedUser.getId(),
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: UserRole.CLIENT,
      birthDate: undefined,
      active: true,
      createdAt: savedUser.getCreatedAt(),
      updatedAt: savedUser.getUpdatedAt(),
    });

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = eventBus.publish.mock.calls[0][0];
    expect(publishedEvent.name).toBe('UserRegistered');
    expect(publishedEvent.recipientEmail).toBe('jane@example.com');
    expect(publishedEvent.payload).toEqual({
      userId: savedUser.getId(),
      name: 'Jane Doe',
    });
  });

  it('registers a new user with an optional birth date', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('hashed-password');

    await useCase.execute({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password1',
      birthDate: '1995-05-20',
    });

    const savedUser = userRepository.save.mock.calls[0][0];
    expect(savedUser.getBirthDate()?.getValue()).toEqual(
      new Date('1995-05-20'),
    );
  });

  it('propagates InvalidBirthDateError for a birth date in the future', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('hashed-password');

    await expect(
      useCase.execute({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password1',
        birthDate: '2999-01-01',
      }),
    ).rejects.toThrow(InvalidBirthDateError);

    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('throws UserAlreadyExistsError when the email is already registered', async () => {
    userRepository.findByEmail.mockResolvedValue(
      User.restore({
        id: 'existing-id',
        name: 'Existing User',
        email: Email.create('jane@example.com'),
        password: Password.fromHash('hash'),
        role: UserRole.CLIENT,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await expect(
      useCase.execute({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password1',
      }),
    ).rejects.toThrow(UserAlreadyExistsError);

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('propagates WeakPasswordError from the domain when the password is weak', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'weak',
      }),
    ).rejects.toThrow(WeakPasswordError);

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('propagates InvalidNameError from the domain when the name is invalid', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('hashed-password');

    await expect(
      useCase.execute({
        name: ' J ',
        email: 'jane@example.com',
        password: 'password1',
      }),
    ).rejects.toThrow(InvalidNameError);

    expect(userRepository.save).not.toHaveBeenCalled();
  });
});
