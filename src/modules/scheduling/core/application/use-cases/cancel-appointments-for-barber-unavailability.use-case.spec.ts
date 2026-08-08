import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import {
  Appointment,
  AppointmentProps,
} from '../../domain/entities/appointment.entity';
import { TimeSlot } from '../../domain/value-objects/time-slot.value-object';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { CancelAppointmentsForBarberUnavailabilityUseCase } from './cancel-appointments-for-barber-unavailability.use-case';

function buildAppointment(
  overrides: Partial<AppointmentProps> = {},
): Appointment {
  return Appointment.restore({
    id: 'appointment-id',
    customerId: 'customer-id',
    barberId: 'barber-id',
    qualificationId: 'qualification-id',
    timeSlot: TimeSlot.create(new Date(2026, 0, 10, 10, 0, 0, 0)),
    status: AppointmentStatus.SCHEDULED,
    createdAt: new Date(2026, 0, 1, 0, 0, 0, 0),
    updatedAt: new Date(2026, 0, 1, 0, 0, 0, 0),
    cancelledAt: null,
    cancellationReason: null,
    ...overrides,
  });
}

function buildUser(id: string): User {
  return User.restore({
    id,
    name: 'A customer',
    email: Email.create(`${id}@example.com`),
    password: Password.fromHash('hashed-password'),
    role: UserRole.CLIENT,
    active: true,
    createdAt: new Date(2026, 0, 1, 0, 0, 0, 0),
    updatedAt: new Date(2026, 0, 1, 0, 0, 0, 0),
  });
}

describe('CancelAppointmentsForBarberUnavailabilityUseCase', () => {
  let appointmentRepository: jest.Mocked<AppointmentRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let useCase: CancelAppointmentsForBarberUnavailabilityUseCase;

  beforeEach(() => {
    appointmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findByDate: jest.fn(),
      findUpcoming: jest.fn(),
      findScheduledByBarberAndRange: jest.fn(),
    };
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    eventBus = {
      publish: jest.fn(),
    };
    useCase = new CancelAppointmentsForBarberUnavailabilityUseCase(
      appointmentRepository,
      userRepository,
      eventBus,
    );
  });

  it('cancels every affected appointment with a prefixed reason and notifies each customer', async () => {
    const appointmentOne = buildAppointment({ id: 'appointment-1' });
    const appointmentTwo = buildAppointment({
      id: 'appointment-2',
      customerId: 'customer-2',
      timeSlot: TimeSlot.create(new Date(2026, 0, 10, 11, 0, 0, 0)),
    });
    appointmentRepository.findScheduledByBarberAndRange.mockResolvedValue([
      appointmentOne,
      appointmentTwo,
    ]);
    userRepository.findById.mockImplementation((id) =>
      Promise.resolve(buildUser(id)),
    );

    const result = await useCase.execute({
      barberId: 'barber-id',
      startAt: new Date(2026, 0, 10, 0, 0, 0, 0),
      endAt: new Date(2026, 0, 11, 0, 0, 0, 0),
      reason: 'Sick leave',
    });

    expect(result.cancelledCount).toBe(2);
    expect(appointmentOne.getCancellationReason()).toBe(
      'Barber unavailable: Sick leave',
    );
    expect(appointmentTwo.getCancellationReason()).toBe(
      'Barber unavailable: Sick leave',
    );
    expect(appointmentRepository.save).toHaveBeenCalledTimes(2);
    expect(eventBus.publish).toHaveBeenCalledTimes(2);
    expect(eventBus.publish.mock.calls[0][0].name).toBe(
      'AppointmentCancelledByAdmin',
    );
  });

  it('does nothing when there are no affected appointments', async () => {
    appointmentRepository.findScheduledByBarberAndRange.mockResolvedValue([]);

    const result = await useCase.execute({
      barberId: 'barber-id',
      startAt: new Date(2026, 0, 10, 0, 0, 0, 0),
      endAt: new Date(2026, 0, 11, 0, 0, 0, 0),
      reason: 'Sick leave',
    });

    expect(result.cancelledCount).toBe(0);
    expect(appointmentRepository.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('skips an appointment whose customer can no longer be found', async () => {
    appointmentRepository.findScheduledByBarberAndRange.mockResolvedValue([
      buildAppointment(),
    ]);
    userRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      barberId: 'barber-id',
      startAt: new Date(2026, 0, 10, 0, 0, 0, 0),
      endAt: new Date(2026, 0, 11, 0, 0, 0, 0),
      reason: 'Sick leave',
    });

    expect(result.cancelledCount).toBe(0);
    expect(appointmentRepository.save).not.toHaveBeenCalled();
  });
});
