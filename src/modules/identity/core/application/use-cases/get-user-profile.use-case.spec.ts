import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { UserRole } from '../../domain/enums/user-role.enum';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { Password } from '../../domain/value-objects/password.value-object';
import { UserRepository } from '../ports/user-repository.port';
import { GetUserProfileUseCase } from './get-user-profile.use-case';

describe('GetUserProfileUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: GetUserProfileUseCase;

  beforeEach(() => {
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
    };
    useCase = new GetUserProfileUseCase(userRepository);
  });

  it('returns the user dto when the user exists', async () => {
    const user = User.restore({
      id: 'user-id',
      name: 'Jane Doe',
      email: Email.create('jane@example.com'),
      password: Password.fromHash('hashed-password'),
      role: UserRole.CLIENT,
      active: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    userRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute({ userId: 'user-id' });

    expect(userRepository.findById).toHaveBeenCalledWith('user-id');
    expect(result.user).toEqual({
      id: 'user-id',
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: UserRole.CLIENT,
      active: true,
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt(),
    });
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'missing-id' })).rejects.toThrow(
      UserNotFoundError,
    );
  });
});
