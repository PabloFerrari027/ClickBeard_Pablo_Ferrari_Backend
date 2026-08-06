import { AppointmentAlreadyCancelledError } from '../errors/appointment-already-cancelled.error';
import { CancellationWindowExpiredError } from '../errors/cancellation-window-expired.error';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { TimeSlot } from '../value-objects/time-slot.value-object';
import { Appointment, AppointmentProps } from './appointment.entity';

function buildProps(
  overrides: Partial<AppointmentProps> = {},
): AppointmentProps {
  return {
    id: 'fixed-id',
    customerId: 'customer-id',
    barberId: 'barber-id',
    qualificationId: 'qualification-id',
    timeSlot: TimeSlot.create(new Date(2026, 0, 10, 10, 0, 0, 0)),
    status: AppointmentStatus.SCHEDULED,
    createdAt: new Date(2026, 0, 1, 0, 0, 0, 0),
    updatedAt: new Date(2026, 0, 1, 0, 0, 0, 0),
    cancelledAt: null,
    ...overrides,
  };
}

describe('Appointment', () => {
  describe('create', () => {
    it('creates a scheduled appointment with a generated id', () => {
      const now = new Date(2026, 0, 1, 0, 0, 0, 0);
      const timeSlot = TimeSlot.create(new Date(2026, 0, 10, 10, 0, 0, 0));

      const appointment = Appointment.create({
        customerId: 'customer-id',
        barberId: 'barber-id',
        qualificationId: 'qualification-id',
        timeSlot,
        now,
      });

      expect(appointment.getId()).toBeTruthy();
      expect(appointment.getStatus()).toBe(AppointmentStatus.SCHEDULED);
      expect(appointment.getTimeSlot()).toBe(timeSlot);
      expect(appointment.getCreatedAt()).toEqual(now);
      expect(appointment.getUpdatedAt()).toEqual(now);
      expect(appointment.getCancelledAt()).toBeNull();
    });
  });

  describe('cancel', () => {
    it('cancels an appointment at least 2 hours before its start', () => {
      const appointment = Appointment.restore(buildProps());
      const now = new Date(2026, 0, 10, 7, 0, 0, 0);

      appointment.cancel(now);

      expect(appointment.getStatus()).toBe(AppointmentStatus.CANCELLED);
      expect(appointment.getCancelledAt()).toEqual(now);
      expect(appointment.getUpdatedAt()).toEqual(now);
    });

    it('allows cancellation exactly 2 hours before the start', () => {
      const appointment = Appointment.restore(buildProps());
      const now = new Date(2026, 0, 10, 8, 0, 0, 0);

      expect(() => appointment.cancel(now)).not.toThrow();
    });

    it('throws CancellationWindowExpiredError when less than 2 hours remain', () => {
      const appointment = Appointment.restore(buildProps());
      const now = new Date(2026, 0, 10, 8, 30, 0, 0);

      expect(() => appointment.cancel(now)).toThrow(
        CancellationWindowExpiredError,
      );
    });

    it('throws AppointmentAlreadyCancelledError when already cancelled', () => {
      const appointment = Appointment.restore(
        buildProps({
          status: AppointmentStatus.CANCELLED,
          cancelledAt: new Date(2026, 0, 2, 0, 0, 0, 0),
        }),
      );

      expect(() =>
        appointment.cancel(new Date(2026, 0, 5, 0, 0, 0, 0)),
      ).toThrow(AppointmentAlreadyCancelledError);
    });
  });
});
