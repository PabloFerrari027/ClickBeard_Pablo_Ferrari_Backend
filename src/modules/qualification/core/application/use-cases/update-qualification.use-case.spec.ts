import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { QualificationAlreadyExistsError } from '../../domain/errors/qualification-already-exists.error';
import { QualificationNotFoundError } from '../../domain/errors/qualification-not-found.error';
import { Qualification } from '../../domain/entities/qualification.entity';
import { QualificationRepository } from '../ports/qualification-repository.port';
import { UpdateQualificationUseCase } from './update-qualification.use-case';

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

describe('UpdateQualificationUseCase', () => {
  let qualificationRepository: jest.Mocked<QualificationRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: UpdateQualificationUseCase;

  function buildQualification(name = 'Beard Trim'): Qualification {
    return Qualification.restore({
      id: 'qualification-id',
      name,
      description: 'Original description',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
  }

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
    useCase = new UpdateQualificationUseCase(
      qualificationRepository,
      userRepository,
    );
  });

  it('updates the qualification and returns its dto', async () => {
    userRepository.findById.mockResolvedValue(buildAdmin());
    const qualification = buildQualification();
    qualificationRepository.findById.mockResolvedValue(qualification);
    qualificationRepository.findByName.mockResolvedValue(null);

    const result = await useCase.execute({
      requesterId: 'admin-id',
      qualificationId: 'qualification-id',
      name: 'Fade Cut',
      description: 'New description',
    });

    expect(qualificationRepository.save).toHaveBeenCalledWith(qualification);
    expect(result.qualification.name).toBe('Fade Cut');
    expect(result.qualification.description).toBe('New description');
  });

  it('throws UserIsNotAdminError when the requester is not an admin', async () => {
    userRepository.findById.mockResolvedValue(buildAdmin(UserRole.BARBER));

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        qualificationId: 'qualification-id',
        name: 'Fade Cut',
      }),
    ).rejects.toThrow(UserIsNotAdminError);
    expect(qualificationRepository.findById).not.toHaveBeenCalled();
  });

  it('throws QualificationNotFoundError when the qualification does not exist', async () => {
    userRepository.findById.mockResolvedValue(buildAdmin());
    qualificationRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        qualificationId: 'missing-id',
        name: 'Fade Cut',
      }),
    ).rejects.toThrow(QualificationNotFoundError);
  });

  it('throws QualificationAlreadyExistsError when the new name belongs to another qualification', async () => {
    userRepository.findById.mockResolvedValue(buildAdmin());
    qualificationRepository.findById.mockResolvedValue(buildQualification());
    qualificationRepository.findByName.mockResolvedValue(
      Qualification.restore({
        id: 'other-qualification-id',
        name: 'Fade Cut',
        description: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        qualificationId: 'qualification-id',
        name: 'Fade Cut',
      }),
    ).rejects.toThrow(QualificationAlreadyExistsError);
    expect(qualificationRepository.save).not.toHaveBeenCalled();
  });

  it('allows renaming to the same name as the qualification being updated', async () => {
    userRepository.findById.mockResolvedValue(buildAdmin());
    const qualification = buildQualification('Beard Trim');
    qualificationRepository.findById.mockResolvedValue(qualification);
    qualificationRepository.findByName.mockResolvedValue(qualification);

    const result = await useCase.execute({
      requesterId: 'admin-id',
      qualificationId: 'qualification-id',
      name: 'Beard Trim',
    });

    expect(result.qualification.name).toBe('Beard Trim');
    expect(qualificationRepository.save).toHaveBeenCalled();
  });

  it('does not check for name conflicts when the name is not being changed', async () => {
    userRepository.findById.mockResolvedValue(buildAdmin());
    qualificationRepository.findById.mockResolvedValue(buildQualification());

    await useCase.execute({
      requesterId: 'admin-id',
      qualificationId: 'qualification-id',
      description: 'Just a description update',
    });

    expect(qualificationRepository.findByName).not.toHaveBeenCalled();
  });
});
