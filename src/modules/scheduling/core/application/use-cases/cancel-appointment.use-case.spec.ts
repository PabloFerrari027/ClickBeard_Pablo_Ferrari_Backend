import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { AppointmentAccessDeniedError } from '../../domain/errors/appointment-access-denied.error';
import { AppointmentAlreadyCancelledError } from '../../domain/errors/appointment-already-cancelled.error';
import { AppointmentNotFoundError } from '../../domain/errors/appointment-not-found.error';
import { CancellationWindowExpiredError } from '../../domain/errors/cancellation-window-expired.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import {
  Appointment,
  AppointmentProps,
} from '../../domain/entities/appointment.entity';
import { TimeSlot } from '../../domain/value-objects/time-slot.value-object';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { CancelAppointmentUseCase } from './cancel-appointment.use-case';

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
    name: 'A person',
    email: Email.create(`${id}@example.com`),
    password: Password.fromHash('hashed-password'),
    role: UserRole.CLIENT,
    active: true,
    createdAt: new Date(2026, 0, 1, 0, 0, 0, 0),
    updatedAt: new Date(2026, 0, 1, 0, 0, 0, 0),
  });
}

describe('CancelAppointmentUseCase', () => {
  let appointmentRepository: jest.Mocked<AppointmentRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let useCase: CancelAppointmentUseCase;

  beforeEach(() => {
    jest.useFakeTimers();

    appointmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findByBarberId: jest.fn(),
      findByDate: jest.fn(),
      findUpcoming: jest.fn(),
      findScheduledByBarberAndRange: jest.fn(),
    };
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
    };
    userRepository.findById.mockResolvedValue(buildUser('customer-id'));
    eventBus = {
      publish: jest.fn(),
    };
    useCase = new CancelAppointmentUseCase(
      appointmentRepository,
      userRepository,
      eventBus,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('cancels the appointment and notifies the customer by email', async () => {
    const appointment = buildAppointment();
    appointmentRepository.findById.mockResolvedValue(appointment);
    jest.setSystemTime(new Date(2026, 0, 10, 7, 0, 0, 0));

    const result = await useCase.execute({
      appointmentId: 'appointment-id',
      customerId: 'customer-id',
    });

    expect(appointment.getStatus()).toBe(AppointmentStatus.CANCELLED);
    expect(appointmentRepository.save).toHaveBeenCalledWith(appointment);
    expect(result.appointment.status).toBe('CANCELLED');

    const publishedEvent = eventBus.publish.mock.calls[0][0];
    expect(publishedEvent.name).toBe('AppointmentCancelled');
    expect(publishedEvent.recipientEmail).toBe('customer-id@example.com');
    expect(publishedEvent.payload).toMatchObject({
      appointmentId: 'appointment-id',
      customerId: 'customer-id',
      barberId: 'barber-id',
      name: 'A person',
    });
  });

  it('throws AppointmentNotFoundError when the appointment does not exist', async () => {
    appointmentRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        appointmentId: 'missing-id',
        customerId: 'customer-id',
      }),
    ).rejects.toThrow(AppointmentNotFoundError);
  });

  it('throws AppointmentAccessDeniedError when the requester is not the owner', async () => {
    appointmentRepository.findById.mockResolvedValue(buildAppointment());

    await expect(
      useCase.execute({
        appointmentId: 'appointment-id',
        customerId: 'someone-else',
      }),
    ).rejects.toThrow(AppointmentAccessDeniedError);
  });

  it('throws UserNotFoundError when the customer no longer exists', async () => {
    appointmentRepository.findById.mockResolvedValue(buildAppointment());
    userRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        appointmentId: 'appointment-id',
        customerId: 'customer-id',
      }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('throws CancellationWindowExpiredError when less than 2 hours remain', async () => {
    appointmentRepository.findById.mockResolvedValue(buildAppointment());
    jest.setSystemTime(new Date(2026, 0, 10, 9, 0, 0, 0));

    await expect(
      useCase.execute({
        appointmentId: 'appointment-id',
        customerId: 'customer-id',
      }),
    ).rejects.toThrow(CancellationWindowExpiredError);
  });

  it('throws AppointmentAlreadyCancelledError when already cancelled', async () => {
    appointmentRepository.findById.mockResolvedValue(
      buildAppointment({
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(2026, 0, 2, 0, 0, 0, 0),
      }),
    );
    jest.setSystemTime(new Date(2026, 0, 3, 0, 0, 0, 0));

    await expect(
      useCase.execute({
        appointmentId: 'appointment-id',
        customerId: 'customer-id',
      }),
    ).rejects.toThrow(AppointmentAlreadyCancelledError);
  });
});
