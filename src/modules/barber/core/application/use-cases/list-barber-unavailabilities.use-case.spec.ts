import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { BarberNotFoundError } from '../../domain/errors/barber-not-found.error';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { Age } from '../../domain/value-objects/age.value-object';
import { Barber } from '../../domain/entities/barber.entity';
import { BarberUnavailability } from '../../domain/entities/barber-unavailability.entity';
import { BarberUnavailabilityRepository } from '../ports/barber-unavailability-repository.port';
import { BarberRepository } from '../ports/barber-repository.port';
import { ListBarberUnavailabilitiesUseCase } from './list-barber-unavailabilities.use-case';

function buildUser(role: UserRole): User {
  return User.restore({
    id: 'admin-id',
    name: 'Admin',
    email: Email.create('admin-id@example.com'),
    password: Password.fromHash('hashed-password'),
    role,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('ListBarberUnavailabilitiesUseCase', () => {
  let barberRepository: jest.Mocked<BarberRepository>;
  let unavailabilityRepository: jest.Mocked<BarberUnavailabilityRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: ListBarberUnavailabilitiesUseCase;

  beforeEach(() => {
    barberRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      existsByQualificationId: jest.fn(),
    };
    unavailabilityRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      listByBarberId: jest.fn(),
      existsOverlapping: jest.fn(),
      delete: jest.fn(),
    };
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    useCase = new ListBarberUnavailabilitiesUseCase(
      barberRepository,
      unavailabilityRepository,
      userRepository,
    );
  });

  it("returns the barber's unavailability periods", async () => {
    userRepository.findById.mockResolvedValue(buildUser(UserRole.ADMIN));
    barberRepository.findById.mockResolvedValue(
      Barber.create({
        userId: 'barber-id',
        name: 'John Barber',
        age: Age.create(30),
        hiredAt: new Date('2025-01-01T00:00:00.000Z'),
        qualificationIds: ['qualification-id'],
      }),
    );
    unavailabilityRepository.listByBarberId.mockResolvedValue([
      BarberUnavailability.create({
        barberId: 'barber-id',
        startAt: new Date('2026-08-10T00:00:00.000Z'),
        endAt: new Date('2026-08-12T00:00:00.000Z'),
        reason: 'Sick leave',
        now: new Date('2026-08-01T00:00:00.000Z'),
      }),
    ]);

    const result = await useCase.execute({
      requesterId: 'admin-id',
      barberId: 'barber-id',
    });

    expect(result.unavailabilities).toHaveLength(1);
    expect(result.unavailabilities[0].reason).toBe('Sick leave');
  });

  it('throws UserIsNotAdminError for a non-admin requester', async () => {
    userRepository.findById.mockResolvedValue(buildUser(UserRole.CLIENT));

    await expect(
      useCase.execute({ requesterId: 'admin-id', barberId: 'barber-id' }),
    ).rejects.toThrow(UserIsNotAdminError);
  });

  it('throws BarberNotFoundError when the barber does not exist', async () => {
    userRepository.findById.mockResolvedValue(buildUser(UserRole.ADMIN));
    barberRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ requesterId: 'admin-id', barberId: 'missing-id' }),
    ).rejects.toThrow(BarberNotFoundError);
  });
});
