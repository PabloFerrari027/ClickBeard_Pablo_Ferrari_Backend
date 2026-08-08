import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { QualificationRepository } from '../../../../qualification/core/application/ports/qualification-repository.port';
import { Qualification } from '../../../../qualification/core/domain/entities/qualification.entity';
import { QualificationNotFoundError } from '../../../../qualification/core/domain/errors/qualification-not-found.error';
import { BarberNotFoundError } from '../../domain/errors/barber-not-found.error';
import { QualificationAlreadyAssignedError } from '../../domain/errors/qualification-already-assigned.error';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { Barber } from '../../domain/entities/barber.entity';
import { Age } from '../../domain/value-objects/age.value-object';
import { BarberRepository } from '../ports/barber-repository.port';
import { AddQualificationToBarberUseCase } from './add-qualification-to-barber.use-case';

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

describe('AddQualificationToBarberUseCase', () => {
  let barberRepository: jest.Mocked<BarberRepository>;
  let qualificationRepository: jest.Mocked<QualificationRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: AddQualificationToBarberUseCase;

  function buildBarber(qualificationIds = ['qualification-1']): Barber {
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
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
    };
    useCase = new AddQualificationToBarberUseCase(
      barberRepository,
      qualificationRepository,
      userRepository,
    );
    userRepository.findById.mockResolvedValue(buildAdmin());
    qualificationRepository.listByBarberId.mockResolvedValue([]);
  });

  it('adds the qualification to the barber and returns its dto', async () => {
    const barber = buildBarber();
    barberRepository.findById.mockResolvedValue(barber);
    qualificationRepository.findById.mockResolvedValue(
      Qualification.create({ name: 'Fade Cut' }),
    );

    const result = await useCase.execute({
      requesterId: 'admin-id',
      barberId: 'barber-id',
      qualificationId: 'qualification-2',
    });

    expect(barber.getQualificationIds()).toEqual([
      'qualification-1',
      'qualification-2',
    ]);
    expect(barberRepository.save).toHaveBeenCalledWith(barber);
    expect(result.barber.id).toBe('barber-id');
  });

  it('throws UserIsNotAdminError when the requester is not an admin', async () => {
    userRepository.findById.mockResolvedValue(buildAdmin(UserRole.BARBER));

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        barberId: 'barber-id',
        qualificationId: 'qualification-2',
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
        qualificationId: 'qualification-2',
      }),
    ).rejects.toThrow(BarberNotFoundError);
  });

  it('throws QualificationNotFoundError when the qualification does not exist', async () => {
    barberRepository.findById.mockResolvedValue(buildBarber());
    qualificationRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        barberId: 'barber-id',
        qualificationId: 'missing-qualification-id',
      }),
    ).rejects.toThrow(QualificationNotFoundError);
    expect(barberRepository.save).not.toHaveBeenCalled();
  });

  it('propagates QualificationAlreadyAssignedError when the qualification is already assigned', async () => {
    barberRepository.findById.mockResolvedValue(
      buildBarber(['qualification-2']),
    );
    qualificationRepository.findById.mockResolvedValue(
      Qualification.create({ name: 'Fade Cut' }),
    );

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        barberId: 'barber-id',
        qualificationId: 'qualification-2',
      }),
    ).rejects.toThrow(QualificationAlreadyAssignedError);
    expect(barberRepository.save).not.toHaveBeenCalled();
  });
});
