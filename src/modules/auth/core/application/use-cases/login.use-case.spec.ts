import { PasswordHasher } from '../../../../identity/core/application/ports/password-hasher.port';
import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { LoginUseCase } from './login.use-case';

function buildUser(active = true): User {
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

describe('LoginUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let eventBus: jest.Mocked<EventBus>;
  let useCase: LoginUseCase;

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
    useCase = new LoginUseCase(userRepository, passwordHasher, eventBus);
  });

  it('publishes UserLoggedIn and returns the user data on valid credentials', async () => {
    userRepository.findByEmail.mockResolvedValue(buildUser());
    passwordHasher.compare.mockResolvedValue(true);

    const result = await useCase.execute({
      email: 'jane@example.com',
      password: 'password1',
    });

    expect(userRepository.findByEmail).toHaveBeenCalledWith('jane@example.com');
    expect(passwordHasher.compare).toHaveBeenCalledWith(
      'password1',
      'hashed-password',
    );
    expect(result.user).toEqual({
      id: 'user-id',
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: UserRole.CLIENT,
    });

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = eventBus.publish.mock.calls[0][0];
    expect(publishedEvent.name).toBe('UserLoggedIn');
    expect(publishedEvent.recipientEmail).toBe('jane@example.com');
    expect(publishedEvent.payload).toEqual({
      userId: 'user-id',
      name: 'Jane Doe',
    });
  });

  it('throws InvalidCredentialsError when no user matches the email', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'missing@example.com', password: 'password1' }),
    ).rejects.toThrow(InvalidCredentialsError);

    expect(passwordHasher.compare).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('throws InvalidCredentialsError when the user is inactive', async () => {
    userRepository.findByEmail.mockResolvedValue(buildUser(false));

    await expect(
      useCase.execute({ email: 'jane@example.com', password: 'password1' }),
    ).rejects.toThrow(InvalidCredentialsError);

    expect(passwordHasher.compare).not.toHaveBeenCalled();
  });

  it('throws InvalidCredentialsError when the password does not match', async () => {
    userRepository.findByEmail.mockResolvedValue(buildUser());
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({
        email: 'jane@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(InvalidCredentialsError);

    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
