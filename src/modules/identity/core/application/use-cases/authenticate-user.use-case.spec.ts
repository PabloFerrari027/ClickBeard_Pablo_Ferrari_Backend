import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { UserRole } from '../../domain/enums/user-role.enum';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { Password } from '../../domain/value-objects/password.value-object';
import { PasswordHasher } from '../ports/password-hasher.port';
import { UserRepository } from '../ports/user-repository.port';
import { AuthenticateUserUseCase } from './authenticate-user.use-case';

describe('AuthenticateUserUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let useCase: AuthenticateUserUseCase;

  const existingUser = User.restore({
    id: 'user-id',
    name: 'Jane Doe',
    email: Email.create('jane@example.com'),
    password: Password.fromHash('hashed-password'),
    role: UserRole.CLIENT,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });

  beforeEach(function (this: void): void {
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
    useCase = new AuthenticateUserUseCase(userRepository, passwordHasher);
  });

  it('returns the user dto when credentials are valid', async function (this: void): Promise<void> {
    userRepository.findByEmail.mockResolvedValue(existingUser);
    passwordHasher.compare.mockResolvedValue(true);

    const result = await useCase.execute({
      email: 'Jane@Example.com',
      password: 'password1',
    });

    expect(userRepository.findByEmail).toHaveBeenCalledWith('jane@example.com');
    expect(passwordHasher.compare).toHaveBeenCalledWith(
      'password1',
      'hashed-password',
    );
    expect(result.user.id).toBe('user-id');
  });

  it('throws InvalidCredentialsError when no user matches the email', async function (this: void): Promise<void> {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'missing@example.com', password: 'password1' }),
    ).rejects.toThrow(InvalidCredentialsError);

    expect(passwordHasher.compare).not.toHaveBeenCalled();
  });

  it('throws InvalidCredentialsError when the password does not match', async function (this: void): Promise<void> {
    userRepository.findByEmail.mockResolvedValue(existingUser);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({
        email: 'jane@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
