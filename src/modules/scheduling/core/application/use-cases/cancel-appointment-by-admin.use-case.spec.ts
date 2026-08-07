import { UserRepository } from '../../../../identity/core/application/ports/user-repository.port';
import { UserRole } from '../../../../identity/core/domain/enums/user-role.enum';
import { User } from '../../../../identity/core/domain/entities/user.entity';
import { Email } from '../../../../identity/core/domain/value-objects/email.value-object';
import { Password } from '../../../../identity/core/domain/value-objects/password.value-object';
import { AppointmentAlreadyCancelledError } from '../../domain/errors/appointment-already-cancelled.error';
import { AppointmentNotFoundError } from '../../domain/errors/appointment-not-found.error';
import { UserIsNotAdminError } from '../../domain/errors/user-is-not-admin.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import {
  Appointment,
  AppointmentProps,
} from '../../domain/entities/appointment.entity';
import { TimeSlot } from '../../domain/value-objects/time-slot.value-object';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import { EventBus } from '../../../../../shared/application/ports/event-bus.port';
import { CancelAppointmentByAdminUseCase } from './cancel-appointment-by-admin.use-case';

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

function buildUser(id: string, role: UserRole): User {
  return User.restore({
    id,
    name: 'A person',
    email: Email.create(`${id}@example.com`),
    password: Password.fromHash('hashed-password'),
    role,
    active: true,
    createdAt: new Date(2026, 0, 1, 0, 0, 0, 0),
    updatedAt: new Date(2026, 0, 1, 0, 0, 0, 0),
  });
}

describe('CancelAppointmentByAdminUseCase', () => {
  let appointmentRepository: jest.Mocked<AppointmentRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let useCase: CancelAppointmentByAdminUseCase;

  beforeEach(() => {
    jest.useFakeTimers();

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
    useCase = new CancelAppointmentByAdminUseCase(
      appointmentRepository,
      userRepository,
      eventBus,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('cancels the appointment, ignoring the 2-hour window, and notifies the customer', async () => {
    userRepository.findById.mockImplementation((id) =>
      Promise.resolve(
        id === 'admin-id'
          ? buildUser('admin-id', UserRole.ADMIN)
          : buildUser('customer-id', UserRole.CLIENT),
      ),
    );
    const appointment = buildAppointment();
    appointmentRepository.findById.mockResolvedValue(appointment);
    jest.setSystemTime(new Date(2026, 0, 10, 9, 45, 0, 0));

    const result = await useCase.execute({
      appointmentId: 'appointment-id',
      requesterId: 'admin-id',
      reason: 'Barber is sick',
    });

    expect(appointment.getStatus()).toBe(AppointmentStatus.CANCELLED);
    expect(appointment.getCancellationReason()).toBe('Barber is sick');
    expect(appointmentRepository.save).toHaveBeenCalledWith(appointment);
    expect(result.appointment.cancellationReason).toBe('Barber is sick');

    const publishedEvent = eventBus.publish.mock.calls[0][0];
    expect(publishedEvent.name).toBe('AppointmentCancelledByAdmin');
    expect(publishedEvent.recipientEmail).toBe('customer-id@example.com');
    expect(publishedEvent.payload).toMatchObject({
      appointmentId: 'appointment-id',
      reason: 'Barber is sick',
    });
  });

  it('throws UserIsNotAdminError for a non-admin requester', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser('customer-id', UserRole.CLIENT),
    );

    await expect(
      useCase.execute({
        appointmentId: 'appointment-id',
        requesterId: 'customer-id',
        reason: 'Any reason',
      }),
    ).rejects.toThrow(UserIsNotAdminError);
    expect(appointmentRepository.findById).not.toHaveBeenCalled();
  });

  it('throws UserNotFoundError when the requester does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        appointmentId: 'appointment-id',
        requesterId: 'missing-id',
        reason: 'Any reason',
      }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('throws AppointmentNotFoundError when the appointment does not exist', async () => {
    userRepository.findById.mockResolvedValue(
      buildUser('admin-id', UserRole.ADMIN),
    );
    appointmentRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        appointmentId: 'missing-id',
        requesterId: 'admin-id',
        reason: 'Any reason',
      }),
    ).rejects.toThrow(AppointmentNotFoundError);
  });

  it('throws AppointmentAlreadyCancelledError when already cancelled', async () => {
    userRepository.findById.mockImplementation((id) =>
      Promise.resolve(
        id === 'admin-id'
          ? buildUser('admin-id', UserRole.ADMIN)
          : buildUser('customer-id', UserRole.CLIENT),
      ),
    );
    appointmentRepository.findById.mockResolvedValue(
      buildAppointment({
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(2026, 0, 2, 0, 0, 0, 0),
      }),
    );

    await expect(
      useCase.execute({
        appointmentId: 'appointment-id',
        requesterId: 'admin-id',
        reason: 'Any reason',
      }),
    ).rejects.toThrow(AppointmentAlreadyCancelledError);
  });
});
