import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { QualificationRepository } from '../../../../qualification/core/application/ports/qualification-repository.port';
import { Qualification } from '../../../../qualification/core/domain/entities/qualification.entity';
import { QualificationNotFoundError } from '../../../../qualification/core/domain/errors/qualification-not-found.error';
import { BarberAlreadyExistsError } from '../../domain/errors/barber-already-exists.error';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { UserIsNotBarberError } from '../../domain/errors/user-is-not-barber.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { Barber } from '../../domain/entities/barber.entity';
import { Age } from '../../domain/value-objects/age.value-object';
import { BarberRepository } from '../ports/barber-repository.port';
import { UserDirectory, UserSnapshot } from '../ports/user-directory.port';
import { CreateBarberUseCase } from './create-barber.use-case';

describe('CreateBarberUseCase', () => {
  let barberRepository: jest.Mocked<BarberRepository>;
  let qualificationRepository: jest.Mocked<QualificationRepository>;
  let userDirectory: jest.Mocked<UserDirectory>;
  let useCase: CreateBarberUseCase;

  function buildSnapshot(overrides: Partial<UserSnapshot> = {}): UserSnapshot {
    return {
      id: 'user-id',
      name: 'John Barber',
      role: UserRole.BARBER,
      active: true,
      ...overrides,
    };
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
    useCase = new CreateBarberUseCase(
      barberRepository,
      qualificationRepository,
      userDirectory,
    );
  });

  it('creates a barber and returns its dto', async () => {
    userDirectory.findById.mockImplementation((id: string) =>
      Promise.resolve(
        id === 'admin-id'
          ? buildSnapshot({ id: 'admin-id', role: UserRole.ADMIN })
          : buildSnapshot(),
      ),
    );
    barberRepository.findById.mockResolvedValue(null);
    qualificationRepository.findById.mockResolvedValue(
      Qualification.create({ name: 'Beard Trim' }),
    );

    const result = await useCase.execute({
      requesterId: 'admin-id',
      userId: 'user-id',
      age: 30,
      hiredAt: new Date('2025-01-01T00:00:00.000Z'),
      qualificationIds: ['qualification-id', 'qualification-id'],
    });

    expect(barberRepository.save).toHaveBeenCalledTimes(1);
    expect(result.barber.userId).toBe('user-id');
    expect(result.barber.age).toBe(30);
    expect(result.barber.qualifications).toHaveLength(1);
  });

  it('throws UserIsNotAdminError when the requester is not an admin', async () => {
    userDirectory.findById.mockResolvedValue(
      buildSnapshot({ id: 'admin-id', role: UserRole.CLIENT }),
    );

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        userId: 'user-id',
        age: 30,
        hiredAt: new Date('2025-01-01T00:00:00.000Z'),
        qualificationIds: ['qualification-id'],
      }),
    ).rejects.toThrow(UserIsNotAdminError);
    expect(barberRepository.save).not.toHaveBeenCalled();
  });

  it('throws UserNotFoundError when the target user does not exist', async () => {
    userDirectory.findById.mockImplementation((id: string) =>
      Promise.resolve(
        id === 'admin-id'
          ? buildSnapshot({ id: 'admin-id', role: UserRole.ADMIN })
          : null,
      ),
    );

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        userId: 'missing-user-id',
        age: 30,
        hiredAt: new Date('2025-01-01T00:00:00.000Z'),
        qualificationIds: ['qualification-id'],
      }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('throws UserIsNotBarberError when the target user does not have the BARBER role', async () => {
    userDirectory.findById.mockImplementation((id: string) =>
      Promise.resolve(
        id === 'admin-id'
          ? buildSnapshot({ id: 'admin-id', role: UserRole.ADMIN })
          : buildSnapshot({ role: UserRole.CLIENT }),
      ),
    );

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        userId: 'user-id',
        age: 30,
        hiredAt: new Date('2025-01-01T00:00:00.000Z'),
        qualificationIds: ['qualification-id'],
      }),
    ).rejects.toThrow(UserIsNotBarberError);
  });

  it('throws BarberAlreadyExistsError when a barber profile already exists for the user', async () => {
    userDirectory.findById.mockImplementation((id: string) =>
      Promise.resolve(
        id === 'admin-id'
          ? buildSnapshot({ id: 'admin-id', role: UserRole.ADMIN })
          : buildSnapshot(),
      ),
    );
    barberRepository.findById.mockResolvedValue(
      Barber.create({
        userId: 'user-id',
        name: 'John Barber',
        age: Age.create(30),
        hiredAt: new Date('2025-01-01T00:00:00.000Z'),
        qualificationIds: ['qualification-id'],
      }),
    );

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        userId: 'user-id',
        age: 30,
        hiredAt: new Date('2025-01-01T00:00:00.000Z'),
        qualificationIds: ['qualification-id'],
      }),
    ).rejects.toThrow(BarberAlreadyExistsError);
  });

  it('throws QualificationNotFoundError when a qualification does not exist', async () => {
    userDirectory.findById.mockImplementation((id: string) =>
      Promise.resolve(
        id === 'admin-id'
          ? buildSnapshot({ id: 'admin-id', role: UserRole.ADMIN })
          : buildSnapshot(),
      ),
    );
    barberRepository.findById.mockResolvedValue(null);
    qualificationRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        userId: 'user-id',
        age: 30,
        hiredAt: new Date('2025-01-01T00:00:00.000Z'),
        qualificationIds: ['missing-qualification-id'],
      }),
    ).rejects.toThrow(QualificationNotFoundError);
    expect(barberRepository.save).not.toHaveBeenCalled();
  });
});
