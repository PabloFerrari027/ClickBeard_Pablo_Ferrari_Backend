import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { UserIsNotAdminError } from '../../../../barber/core/domain/errors/user-is-not-admin.error';
import { QualificationInUseError } from '../../domain/errors/qualification-in-use.error';
import { QualificationNotFoundError } from '../../domain/errors/qualification-not-found.error';
import { BarberRepository } from '../../../../barber/core/application/ports/barber-repository.port';
import {
  UserDirectory,
  UserSnapshot,
} from '../../../../barber/core/application/ports/user-directory.port';
import { Qualification } from '../../domain/entities/qualification.entity';
import { QualificationRepository } from '../ports/qualification-repository.port';
import { DeleteQualificationUseCase } from './delete-qualification.use-case';

describe('DeleteQualificationUseCase', () => {
  let qualificationRepository: jest.Mocked<QualificationRepository>;
  let barberRepository: jest.Mocked<BarberRepository>;
  let userDirectory: jest.Mocked<UserDirectory>;
  let useCase: DeleteQualificationUseCase;

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
    barberRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      existsByQualificationId: jest.fn(),
    };
    userDirectory = {
      findById: jest.fn(),
    };
    useCase = new DeleteQualificationUseCase(
      qualificationRepository,
      barberRepository,
      userDirectory,
    );
  });

  it('deletes the qualification when it is not in use', async () => {
    userDirectory.findById.mockResolvedValue(buildAdminSnapshot());
    qualificationRepository.findById.mockResolvedValue(
      Qualification.create({ name: 'Beard Trim' }),
    );
    barberRepository.existsByQualificationId.mockResolvedValue(false);

    await useCase.execute({
      requesterId: 'admin-id',
      qualificationId: 'qualification-id',
    });

    expect(qualificationRepository.delete).toHaveBeenCalledWith(
      'qualification-id',
    );
  });

  it('throws UserIsNotAdminError when the requester is not an admin', async () => {
    userDirectory.findById.mockResolvedValue(
      buildAdminSnapshot({ role: UserRole.BARBER }),
    );

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        qualificationId: 'qualification-id',
      }),
    ).rejects.toThrow(UserIsNotAdminError);
    expect(qualificationRepository.delete).not.toHaveBeenCalled();
  });

  it('throws QualificationNotFoundError when the qualification does not exist', async () => {
    userDirectory.findById.mockResolvedValue(buildAdminSnapshot());
    qualificationRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        qualificationId: 'missing-id',
      }),
    ).rejects.toThrow(QualificationNotFoundError);
    expect(qualificationRepository.delete).not.toHaveBeenCalled();
  });

  it('throws QualificationInUseError when a barber is assigned to the qualification', async () => {
    userDirectory.findById.mockResolvedValue(buildAdminSnapshot());
    qualificationRepository.findById.mockResolvedValue(
      Qualification.create({ name: 'Beard Trim' }),
    );
    barberRepository.existsByQualificationId.mockResolvedValue(true);

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        qualificationId: 'qualification-id',
      }),
    ).rejects.toThrow(QualificationInUseError);
    expect(qualificationRepository.delete).not.toHaveBeenCalled();
  });
});
