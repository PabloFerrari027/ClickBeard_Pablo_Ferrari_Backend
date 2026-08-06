import { AppointmentAccessDeniedError } from '../../domain/errors/appointment-access-denied.error';
import { AppointmentAlreadyCancelledError } from '../../domain/errors/appointment-already-cancelled.error';
import { AppointmentNotFoundError } from '../../domain/errors/appointment-not-found.error';
import { CancellationWindowExpiredError } from '../../domain/errors/cancellation-window-expired.error';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import {
  Appointment,
  AppointmentProps,
} from '../../domain/entities/appointment.entity';
import { TimeSlot } from '../../domain/value-objects/time-slot.value-object';
import { AppointmentRepository } from '../ports/appointment-repository.port';
import { Clock } from '../../../../../shared/application/ports/clock.port';
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
    ...overrides,
  });
}

describe('CancelAppointmentUseCase', () => {
  let appointmentRepository: jest.Mocked<AppointmentRepository>;
  let clock: jest.Mocked<Clock>;
  let eventBus: jest.Mocked<EventBus>;
  let useCase: CancelAppointmentUseCase;

  beforeEach(() => {
    appointmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findByDate: jest.fn(),
      findUpcoming: jest.fn(),
    };
    clock = {
      now: jest.fn(),
    };
    eventBus = {
      publish: jest.fn(),
    };
    useCase = new CancelAppointmentUseCase(
      appointmentRepository,
      clock,
      eventBus,
    );
  });

  it('cancels the appointment and publishes AppointmentCancelled', async () => {
    const appointment = buildAppointment();
    appointmentRepository.findById.mockResolvedValue(appointment);
    clock.now.mockReturnValue(new Date(2026, 0, 10, 7, 0, 0, 0));

    const result = await useCase.execute({
      appointmentId: 'appointment-id',
      customerId: 'customer-id',
    });

    expect(appointment.getStatus()).toBe(AppointmentStatus.CANCELLED);
    expect(appointmentRepository.save).toHaveBeenCalledWith(appointment);
    expect(result.appointment.status).toBe('CANCELLED');
    expect(eventBus.publish.mock.calls[0][0].name).toBe('AppointmentCancelled');
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

  it('throws CancellationWindowExpiredError when less than 2 hours remain', async () => {
    appointmentRepository.findById.mockResolvedValue(buildAppointment());
    clock.now.mockReturnValue(new Date(2026, 0, 10, 9, 0, 0, 0));

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
    clock.now.mockReturnValue(new Date(2026, 0, 3, 0, 0, 0, 0));

    await expect(
      useCase.execute({
        appointmentId: 'appointment-id',
        customerId: 'customer-id',
      }),
    ).rejects.toThrow(AppointmentAlreadyCancelledError);
  });
});
