import { PasswordHasher } from '../../../../identity/core/application/ports/password-hasher.port';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { AuthUserSnapshot, UserDirectory } from '../ports/user-directory.port';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { LoginUseCase } from './login.use-case';

function buildSnapshot(
  overrides: Partial<AuthUserSnapshot> = {},
): AuthUserSnapshot {
  return {
    id: 'user-id',
    name: 'Jane Doe',
    email: 'jane@example.com',
    passwordHash: 'hashed-password',
    role: 'CLIENT',
    active: true,
    ...overrides,
  };
}

describe('LoginUseCase', () => {
  let userDirectory: jest.Mocked<UserDirectory>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let eventBus: jest.Mocked<EventBus>;
  let useCase: LoginUseCase;

  beforeEach(() => {
    userDirectory = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };
    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    eventBus = {
      publish: jest.fn(),
    };
    useCase = new LoginUseCase(userDirectory, passwordHasher, eventBus);
  });

  it('publishes UserLoggedIn and returns the user data on valid credentials', async () => {
    userDirectory.findByEmail.mockResolvedValue(buildSnapshot());
    passwordHasher.compare.mockResolvedValue(true);

    const result = await useCase.execute({
      email: 'jane@example.com',
      password: 'password1',
    });

    expect(userDirectory.findByEmail).toHaveBeenCalledWith('jane@example.com');
    expect(passwordHasher.compare).toHaveBeenCalledWith(
      'password1',
      'hashed-password',
    );
    expect(result.user).toEqual({
      id: 'user-id',
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: 'CLIENT',
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
    userDirectory.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'missing@example.com', password: 'password1' }),
    ).rejects.toThrow(InvalidCredentialsError);

    expect(passwordHasher.compare).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('throws InvalidCredentialsError when the user is inactive', async () => {
    userDirectory.findByEmail.mockResolvedValue(
      buildSnapshot({ active: false }),
    );

    await expect(
      useCase.execute({ email: 'jane@example.com', password: 'password1' }),
    ).rejects.toThrow(InvalidCredentialsError);

    expect(passwordHasher.compare).not.toHaveBeenCalled();
  });

  it('throws InvalidCredentialsError when the password does not match', async () => {
    userDirectory.findByEmail.mockResolvedValue(buildSnapshot());
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
