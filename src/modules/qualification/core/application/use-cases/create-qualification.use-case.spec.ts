import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { UserIsNotAdminError } from '../../../../barber/core/domain/errors/user-is-not-admin.error';
import { UserNotFoundError } from '../../../../barber/core/domain/errors/user-not-found.error';
import { QualificationAlreadyExistsError } from '../../domain/errors/qualification-already-exists.error';
import {
  UserDirectory,
  UserSnapshot,
} from '../../../../barber/core/application/ports/user-directory.port';
import { Qualification } from '../../domain/entities/qualification.entity';
import { QualificationRepository } from '../ports/qualification-repository.port';
import { CreateQualificationUseCase } from './create-qualification.use-case';

describe('CreateQualificationUseCase', () => {
  let qualificationRepository: jest.Mocked<QualificationRepository>;
  let userDirectory: jest.Mocked<UserDirectory>;
  let useCase: CreateQualificationUseCase;

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
    useCase = new CreateQualificationUseCase(
      qualificationRepository,
      userDirectory,
    );
  });

  it('creates a qualification and returns its dto', async () => {
    userDirectory.findById.mockResolvedValue(buildAdminSnapshot());
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
    userDirectory.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ requesterId: 'missing-id', name: 'Beard Trim' }),
    ).rejects.toThrow(UserNotFoundError);
    expect(qualificationRepository.save).not.toHaveBeenCalled();
  });

  it('throws UserIsNotAdminError when the requester is not an admin', async () => {
    userDirectory.findById.mockResolvedValue(
      buildAdminSnapshot({ role: UserRole.BARBER }),
    );

    await expect(
      useCase.execute({ requesterId: 'admin-id', name: 'Beard Trim' }),
    ).rejects.toThrow(UserIsNotAdminError);
    expect(qualificationRepository.save).not.toHaveBeenCalled();
  });

  it('throws QualificationAlreadyExistsError when the name is already taken', async () => {
    userDirectory.findById.mockResolvedValue(buildAdminSnapshot());
    qualificationRepository.findByName.mockResolvedValue(
      Qualification.create({ name: 'Beard Trim' }),
    );

    await expect(
      useCase.execute({ requesterId: 'admin-id', name: 'Beard Trim' }),
    ).rejects.toThrow(QualificationAlreadyExistsError);
    expect(qualificationRepository.save).not.toHaveBeenCalled();
  });
});
