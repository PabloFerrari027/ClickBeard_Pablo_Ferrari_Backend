import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { UserIsNotAdminError } from '../../../../barber/core/domain/errors/user-is-not-admin.error';
import { QualificationAlreadyExistsError } from '../../domain/errors/qualification-already-exists.error';
import { QualificationNotFoundError } from '../../domain/errors/qualification-not-found.error';
import {
  UserDirectory,
  UserSnapshot,
} from '../../../../barber/core/application/ports/user-directory.port';
import { Qualification } from '../../domain/entities/qualification.entity';
import { QualificationRepository } from '../ports/qualification-repository.port';
import { UpdateQualificationUseCase } from './update-qualification.use-case';

describe('UpdateQualificationUseCase', () => {
  let qualificationRepository: jest.Mocked<QualificationRepository>;
  let userDirectory: jest.Mocked<UserDirectory>;
  let useCase: UpdateQualificationUseCase;

  function buildAdminSnapshot(
    overrides: Partial<UserSnapshot> = {},
  ): UserSnapshot {
    return {
      id: 'admin-id',
      name: 'Admin User',
      role: UserRole.ADMIN,
      active: true,
      ...overrides,
    };
  }

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
    userDirectory = {
      findById: jest.fn(),
    };
    useCase = new UpdateQualificationUseCase(
      qualificationRepository,
      userDirectory,
    );
  });

  it('updates the qualification and returns its dto', async () => {
    userDirectory.findById.mockResolvedValue(buildAdminSnapshot());
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
    userDirectory.findById.mockResolvedValue(
      buildAdminSnapshot({ role: UserRole.BARBER }),
    );

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
    userDirectory.findById.mockResolvedValue(buildAdminSnapshot());
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
    userDirectory.findById.mockResolvedValue(buildAdminSnapshot());
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
    userDirectory.findById.mockResolvedValue(buildAdminSnapshot());
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
    userDirectory.findById.mockResolvedValue(buildAdminSnapshot());
    qualificationRepository.findById.mockResolvedValue(buildQualification());

    await useCase.execute({
      requesterId: 'admin-id',
      qualificationId: 'qualification-id',
      description: 'Just a description update',
    });

    expect(qualificationRepository.findByName).not.toHaveBeenCalled();
  });
});
