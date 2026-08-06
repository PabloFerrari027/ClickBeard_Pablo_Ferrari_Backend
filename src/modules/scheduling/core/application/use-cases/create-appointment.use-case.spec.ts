import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { AppointmentTooSoonError } from '../../domain/errors/appointment-too-soon.error';
import { BarberDoesNotHaveQualificationError } from '../../domain/errors/barber-does-not-have-qualification.error';
import { BarberNotFoundError } from '../../domain/errors/barber-not-found.error';
import { BarberTimeSlotConflictError } from '../../domain/errors/barber-time-slot-conflict.error';
import { InvalidTimeSlotError } from '../../domain/errors/invalid-time-slot.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import { AvailabilityService } from '../ports/availability-service.port';
import {
  BarberDirectory,
  BarberSnapshot,
} from '../ports/barber-directory.port';
import { TransactionManager } from '../ports/transaction-manager.port';
import { Clock } from '../../../../../shared/application/ports/clock.port';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { CreateAppointmentUseCase } from './create-appointment.use-case';

function buildCustomer(active = true): User {
  return User.restore({
    id: 'customer-id',
    name: 'Jane Doe',
    email: Email.create('customer-id@example.com'),
    password: Password.fromHash('hashed-password'),
    role: UserRole.CLIENT,
    active,
    createdAt: new Date(2026, 0, 1, 0, 0, 0, 0),
    updatedAt: new Date(2026, 0, 1, 0, 0, 0, 0),
  });
}

function buildBarberSnapshot(
  overrides: Partial<BarberSnapshot> = {},
): BarberSnapshot {
  return {
    id: 'barber-id',
    qualificationIds: ['qualification-id'],
    active: true,
    ...overrides,
  };
}

describe('CreateAppointmentUseCase', () => {
  let appointmentRepository: jest.Mocked<AppointmentRepository>;
  let availabilityService: jest.Mocked<AvailabilityService>;
  let userRepository: jest.Mocked<UserRepository>;
  let barberDirectory: jest.Mocked<BarberDirectory>;
  let transactionManager: jest.Mocked<TransactionManager>;
  let clock: jest.Mocked<Clock>;
  let eventBus: jest.Mocked<EventBus>;
  let useCase: CreateAppointmentUseCase;

  const now = new Date(2026, 0, 1, 0, 0, 0, 0);

  beforeEach(() => {
    appointmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findByDate: jest.fn(),
      findUpcoming: jest.fn(),
    };
    availabilityService = {
      isBarberAvailable: jest.fn(),
      getBookedSlots: jest.fn(),
    };
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    barberDirectory = {
      findById: jest.fn(),
    };
    transactionManager = {
      runInTransaction: jest.fn((work: () => Promise<unknown>) => work()),
    } as unknown as jest.Mocked<TransactionManager>;
    clock = {
      now: jest.fn().mockReturnValue(now),
    };
    eventBus = {
      publish: jest.fn(),
    };
    useCase = new CreateAppointmentUseCase(
      appointmentRepository,
      availabilityService,
      userRepository,
      barberDirectory,
      transactionManager,
      clock,
      eventBus,
    );

    userRepository.findById.mockResolvedValue(buildCustomer());
    barberDirectory.findById.mockResolvedValue(buildBarberSnapshot());
    availabilityService.isBarberAvailable.mockResolvedValue(true);
  });

  const validInput = {
    customerId: 'customer-id',
    barberId: 'barber-id',
    qualificationId: 'qualification-id',
    startAt: new Date(2026, 0, 10, 10, 0, 0, 0),
  };

  it('creates an appointment and publishes AppointmentCreated', async () => {
    const result = await useCase.execute(validInput);

    expect(appointmentRepository.save).toHaveBeenCalledTimes(1);
    expect(result.appointment.customerId).toBe('customer-id');
    expect(result.appointment.barberId).toBe('barber-id');
    expect(result.appointment.status).toBe('SCHEDULED');

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(eventBus.publish.mock.calls[0][0].name).toBe('AppointmentCreated');
  });

  it('throws UserNotFoundError when the customer does not exist or is inactive', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(validInput)).rejects.toThrow(
      UserNotFoundError,
    );
  });

  it('throws BarberNotFoundError when the barber profile does not exist', async () => {
    barberDirectory.findById.mockResolvedValue(null);

    await expect(useCase.execute(validInput)).rejects.toThrow(
      BarberNotFoundError,
    );
  });

  it('throws BarberNotFoundError when the barber is inactive', async () => {
    barberDirectory.findById.mockResolvedValue(
      buildBarberSnapshot({ active: false }),
    );

    await expect(useCase.execute(validInput)).rejects.toThrow(
      BarberNotFoundError,
    );
  });

  it('throws BarberDoesNotHaveQualificationError when the barber lacks the qualification', async () => {
    barberDirectory.findById.mockResolvedValue(
      buildBarberSnapshot({ qualificationIds: ['other-qualification'] }),
    );

    await expect(useCase.execute(validInput)).rejects.toThrow(
      BarberDoesNotHaveQualificationError,
    );
  });

  it('throws InvalidTimeSlotError for a non grid-aligned start time', async () => {
    await expect(
      useCase.execute({
        ...validInput,
        startAt: new Date(2026, 0, 10, 10, 15, 0, 0),
      }),
    ).rejects.toThrow(InvalidTimeSlotError);
  });

  it('throws AppointmentTooSoonError when the slot starts before now', async () => {
    clock.now.mockReturnValue(new Date(2026, 0, 20, 0, 0, 0, 0));

    await expect(useCase.execute(validInput)).rejects.toThrow(
      AppointmentTooSoonError,
    );
  });

  it('throws AppointmentTooSoonError when less than 2 hours of notice remain', async () => {
    clock.now.mockReturnValue(new Date(2026, 0, 10, 9, 0, 0, 0));

    await expect(useCase.execute(validInput)).rejects.toThrow(
      AppointmentTooSoonError,
    );
  });

  it('allows creation when exactly 2 hours of notice remain', async () => {
    clock.now.mockReturnValue(new Date(2026, 0, 10, 8, 0, 0, 0));

    await expect(useCase.execute(validInput)).resolves.toBeDefined();
  });

  it('throws BarberTimeSlotConflictError when the barber is not available', async () => {
    availabilityService.isBarberAvailable.mockResolvedValue(false);

    await expect(useCase.execute(validInput)).rejects.toThrow(
      BarberTimeSlotConflictError,
    );
    expect(appointmentRepository.save).not.toHaveBeenCalled();
  });
});
