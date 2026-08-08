import { UserRole } from '../../domain/enums/user-role.enum';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { Password } from '../../domain/value-objects/password.value-object';
import { UserRepository } from '../ports/user-repository.port';
import { ListUsersUseCase } from './list-users.use-case';

describe('ListUsersUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: ListUsersUseCase;

  function buildUser(id: string): User {
    return User.restore({
      id,
      name: 'Jane Doe',
      email: Email.create(`${id}@example.com`),
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
    useCase = new ListUsersUseCase(userRepository);
  });

  it('lists users using the default page when none is provided', async () => {
    userRepository.findAll.mockResolvedValue({
      users: [buildUser('user-1')],
      total: 1,
    });

    const result = await useCase.execute({});

    expect(userRepository.findAll).toHaveBeenCalledWith(1, 100);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.users).toEqual([
      expect.objectContaining({ id: 'user-1', email: 'user-1@example.com' }),
    ]);
  });

  it('uses the given page when it is a positive number', async () => {
    userRepository.findAll.mockResolvedValue({ users: [], total: 0 });

    const result = await useCase.execute({ page: 3 });

    expect(userRepository.findAll).toHaveBeenCalledWith(3, 100);
    expect(result.page).toBe(3);
  });

  it('falls back to the default page when the given page is not positive', async () => {
    userRepository.findAll.mockResolvedValue({ users: [], total: 0 });

    const result = await useCase.execute({ page: 0 });

    expect(userRepository.findAll).toHaveBeenCalledWith(1, 100);
    expect(result.page).toBe(1);
  });

  it('computes totalPages from the total count and default limit', async () => {
    userRepository.findAll.mockResolvedValue({
      users: [buildUser('user-1')],
      total: 250,
    });

    const result = await useCase.execute({});

    expect(result.totalPages).toBe(3);
  });
});
