import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { BarberMustHaveAtLeastOneQualificationError } from '../../domain/errors/barber-must-have-at-least-one-qualification.error';
import { BarberNotFoundError } from '../../domain/errors/barber-not-found.error';
import { QualificationNotAssignedError } from '../../domain/errors/qualification-not-assigned.error';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { Barber } from '../../domain/entities/barber.entity';
import { Age } from '../../domain/value-objects/age.value-object';
import { QualificationRepository } from '../../../../qualification/core/application/ports/qualification-repository.port';
import { BarberRepository } from '../ports/barber-repository.port';
import { UserDirectory, UserSnapshot } from '../ports/user-directory.port';
import { RemoveQualificationFromBarberUseCase } from './remove-qualification-from-barber.use-case';

describe('RemoveQualificationFromBarberUseCase', () => {
  let barberRepository: jest.Mocked<BarberRepository>;
  let qualificationRepository: jest.Mocked<QualificationRepository>;
  let userDirectory: jest.Mocked<UserDirectory>;
  let useCase: RemoveQualificationFromBarberUseCase;

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

  function buildBarber(qualificationIds: string[]): Barber {
    return Barber.restore({
      id: 'barber-id',
      name: 'John Barber',
      age: Age.create(30),
      hiredAt: new Date('2025-01-01T00:00:00.000Z'),
      qualificationIds,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
  }

  beforeEach(() => {
    barberRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      existsByQualificationId: jest.fn(),
    };
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
    useCase = new RemoveQualificationFromBarberUseCase(
      barberRepository,
      qualificationRepository,
      userDirectory,
    );
    userDirectory.findById.mockResolvedValue(buildAdminSnapshot());
    qualificationRepository.listByBarberId.mockResolvedValue([]);
  });

  it('removes the qualification from the barber and returns its dto', async () => {
    const barber = buildBarber(['qualification-1', 'qualification-2']);
    barberRepository.findById.mockResolvedValue(barber);

    const result = await useCase.execute({
      requesterId: 'admin-id',
      barberId: 'barber-id',
      qualificationId: 'qualification-1',
    });

    expect(barber.getQualificationIds()).toEqual(['qualification-2']);
    expect(barberRepository.save).toHaveBeenCalledWith(barber);
    expect(result.barber.id).toBe('barber-id');
  });

  it('throws UserIsNotAdminError when the requester is not an admin', async () => {
    userDirectory.findById.mockResolvedValue(
      buildAdminSnapshot({ role: UserRole.BARBER }),
    );

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        barberId: 'barber-id',
        qualificationId: 'qualification-1',
      }),
    ).rejects.toThrow(UserIsNotAdminError);
    expect(barberRepository.findById).not.toHaveBeenCalled();
  });

  it('throws BarberNotFoundError when the barber does not exist', async () => {
    barberRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        barberId: 'missing-id',
        qualificationId: 'qualification-1',
      }),
    ).rejects.toThrow(BarberNotFoundError);
  });

  it('propagates QualificationNotAssignedError when the qualification is not assigned', async () => {
    barberRepository.findById.mockResolvedValue(
      buildBarber(['qualification-1']),
    );

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        barberId: 'barber-id',
        qualificationId: 'qualification-2',
      }),
    ).rejects.toThrow(QualificationNotAssignedError);
    expect(barberRepository.save).not.toHaveBeenCalled();
  });

  it('propagates BarberMustHaveAtLeastOneQualificationError when removing the last qualification', async () => {
    barberRepository.findById.mockResolvedValue(
      buildBarber(['qualification-1']),
    );

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        barberId: 'barber-id',
        qualificationId: 'qualification-1',
      }),
    ).rejects.toThrow(BarberMustHaveAtLeastOneQualificationError);
    expect(barberRepository.save).not.toHaveBeenCalled();
  });
});
