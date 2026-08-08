import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { QualificationAlreadyExistsError } from '../../domain/errors/qualification-already-exists.error';
import { Qualification } from '../../domain/entities/qualification.entity';
import { QualificationRepository } from '../ports/qualification-repository.port';
import { CreateQualificationUseCase } from './create-qualification.use-case';

function buildAdmin(role: UserRole = UserRole.ADMIN): User {
  return User.restore({
    id: 'admin-id',
    name: 'Admin User',
    email: Email.create('admin-id@example.com'),
    password: Password.fromHash('hashed-password'),
    role,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('CreateQualificationUseCase', () => {
  let qualificationRepository: jest.Mocked<QualificationRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: CreateQualificationUseCase;

  beforeEach(() => {
    qualificationRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      listByBarberId: jest.fn(),
      delete: jest.fn(),
    };
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
    };
    useCase = new CreateQualificationUseCase(
      qualificationRepository,
      userRepository,
    );
  });

  it('creates a qualification and returns its dto', async () => {
    userRepository.findById.mockResolvedValue(buildAdmin());
    qualificationRepository.findByName.mockResolvedValue(null);

    const result = await useCase.execute({
      requesterId: 'admin-id',
      name: 'Beard Trim',
      description: 'Trims and shapes beards',
    });

    expect(qualificationRepository.save).toHaveBeenCalledTimes(1);
    expect(result.qualification.name).toBe('Beard Trim');
    expect(result.qualification.description).toBe('Trims and shapes beards');
  });

  it('throws UserNotFoundError when the requester does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ requesterId: 'missing-id', name: 'Beard Trim' }),
    ).rejects.toThrow(UserNotFoundError);
    expect(qualificationRepository.save).not.toHaveBeenCalled();
  });

  it('throws UserIsNotAdminError when the requester is not an admin', async () => {
    userRepository.findById.mockResolvedValue(buildAdmin(UserRole.BARBER));

    await expect(
      useCase.execute({ requesterId: 'admin-id', name: 'Beard Trim' }),
    ).rejects.toThrow(UserIsNotAdminError);
    expect(qualificationRepository.save).not.toHaveBeenCalled();
  });

  it('throws QualificationAlreadyExistsError when the name is already taken', async () => {
    userRepository.findById.mockResolvedValue(buildAdmin());
    qualificationRepository.findByName.mockResolvedValue(
      Qualification.create({ name: 'Beard Trim' }),
    );

    await expect(
      useCase.execute({ requesterId: 'admin-id', name: 'Beard Trim' }),
    ).rejects.toThrow(QualificationAlreadyExistsError);
    expect(qualificationRepository.save).not.toHaveBeenCalled();
  });
});
