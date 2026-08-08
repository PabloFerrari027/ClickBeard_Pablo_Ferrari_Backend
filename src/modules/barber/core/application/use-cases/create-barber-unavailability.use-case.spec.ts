import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { BarberNotFoundError } from '../../domain/errors/barber-not-found.error';
import { BarberUnavailabilityOverlapError } from '../../domain/errors/barber-unavailability-overlap.error';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { Age } from '../../domain/value-objects/age.value-object';
import { Barber } from '../../domain/entities/barber.entity';
import { BarberUnavailabilityRepository } from '../ports/barber-unavailability-repository.port';
import { BarberRepository } from '../ports/barber-repository.port';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { CreateBarberUnavailabilityUseCase } from './create-barber-unavailability.use-case';

function buildUser(overrides: { id?: string; role?: UserRole } = {}): User {
  const id = overrides.id ?? 'admin-id';

  return User.restore({
    id,
    name: 'Admin',
    email: Email.create(`${id}@example.com`),
    password: Password.fromHash('hashed-password'),
    role: overrides.role ?? UserRole.ADMIN,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function buildBarber(): Barber {
  return Barber.create({
    userId: 'barber-id',
    name: 'John Barber',
    age: Age.create(30),
    hiredAt: new Date('2025-01-01T00:00:00.000Z'),
    qualificationIds: ['qualification-id'],
  });
}

describe('CreateBarberUnavailabilityUseCase', () => {
  let barberRepository: jest.Mocked<BarberRepository>;
  let unavailabilityRepository: jest.Mocked<BarberUnavailabilityRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let useCase: CreateBarberUnavailabilityUseCase;

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
    eventBus = {
      publish: jest.fn(),
    };
    useCase = new CreateBarberUnavailabilityUseCase(
      barberRepository,
      unavailabilityRepository,
      userRepository,
      eventBus,
    );
  });

  it('creates the unavailability period and publishes BarberUnavailabilityCreated', async () => {
    userRepository.findById.mockResolvedValue(buildUser());
    barberRepository.findById.mockResolvedValue(buildBarber());
    unavailabilityRepository.existsOverlapping.mockResolvedValue(false);

    const result = await useCase.execute({
      requesterId: 'admin-id',
      barberId: 'barber-id',
      startAt: new Date('2026-08-10T00:00:00.000Z'),
      endAt: new Date('2026-08-12T00:00:00.000Z'),
      reason: 'Sick leave',
    });

    expect(unavailabilityRepository.save).toHaveBeenCalledTimes(1);
    expect(result.unavailability.barberId).toBe('barber-id');
    expect(result.unavailability.reason).toBe('Sick leave');
    expect(eventBus.publish.mock.calls[0][0].name).toBe(
      'BarberUnavailabilityCreated',
    );
  });

  it('throws UserIsNotAdminError when the requester is not an admin', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser({ role: UserRole.CLIENT }),
    );

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        barberId: 'barber-id',
        startAt: new Date('2026-08-10T00:00:00.000Z'),
        endAt: new Date('2026-08-12T00:00:00.000Z'),
        reason: 'Sick leave',
      }),
    ).rejects.toThrow(UserIsNotAdminError);
    expect(unavailabilityRepository.save).not.toHaveBeenCalled();
  });

  it('throws BarberNotFoundError when the barber does not exist', async () => {
    userRepository.findById.mockResolvedValue(buildUser());
    barberRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        barberId: 'missing-barber-id',
        startAt: new Date('2026-08-10T00:00:00.000Z'),
        endAt: new Date('2026-08-12T00:00:00.000Z'),
        reason: 'Sick leave',
      }),
    ).rejects.toThrow(BarberNotFoundError);
  });

  it('throws BarberUnavailabilityOverlapError when the period overlaps an existing one', async () => {
    userRepository.findById.mockResolvedValue(buildUser());
    barberRepository.findById.mockResolvedValue(buildBarber());
    unavailabilityRepository.existsOverlapping.mockResolvedValue(true);

    await expect(
      useCase.execute({
        requesterId: 'admin-id',
        barberId: 'barber-id',
        startAt: new Date('2026-08-10T00:00:00.000Z'),
        endAt: new Date('2026-08-12T00:00:00.000Z'),
        reason: 'Sick leave',
      }),
    ).rejects.toThrow(BarberUnavailabilityOverlapError);
    expect(unavailabilityRepository.save).not.toHaveBeenCalled();
  });
});
