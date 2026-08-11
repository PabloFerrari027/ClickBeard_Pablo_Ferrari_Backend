import { AppointmentAlreadyCancelledError } from '../errors/appointment-already-cancelled.error';
import { CancellationReasonRequiredError } from '../errors/cancellation-reason-required.error';
import { CancellationWindowExpiredError } from '../errors/cancellation-window-expired.error';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { TimeSlot } from '../value-objects/time-slot.value-object';
import { businessTime } from '../../../test-support/business-time';
import { Appointment, AppointmentProps } from './appointment.entity';

function buildProps(
  overrides: Partial<AppointmentProps> = {},
): AppointmentProps {
  return {
    id: 'fixed-id',
    customerId: 'customer-id',
    barberId: 'barber-id',
    qualificationId: 'qualification-id',
    timeSlot: TimeSlot.create(businessTime(2026, 0, 10, 10, 0, 0, 0)),
    status: AppointmentStatus.SCHEDULED,
    createdAt: new Date(2026, 0, 1, 0, 0, 0, 0),
    updatedAt: new Date(2026, 0, 1, 0, 0, 0, 0),
    cancelledAt: null,
    cancellationReason: null,
    ...overrides,
  };
}

describe('Appointment', () => {
  describe('create', () => {
    it('creates a scheduled appointment with a generated id', () => {
      const now = new Date(2026, 0, 1, 0, 0, 0, 0);
      const timeSlot = TimeSlot.create(businessTime(2026, 0, 10, 10, 0, 0, 0));

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
      const now = businessTime(2026, 0, 10, 7, 0, 0, 0);

      appointment.cancel(now);

      expect(appointment.getStatus()).toBe(AppointmentStatus.CANCELLED);
      expect(appointment.getCancelledAt()).toEqual(now);
      expect(appointment.getUpdatedAt()).toEqual(now);
    });

    it('allows cancellation exactly 2 hours before the start', () => {
      const appointment = Appointment.restore(buildProps());
      const now = businessTime(2026, 0, 10, 8, 0, 0, 0);

      expect(() => appointment.cancel(now)).not.toThrow();
    });

    it('throws CancellationWindowExpiredError when less than 2 hours remain', () => {
      const appointment = Appointment.restore(buildProps());
      const now = businessTime(2026, 0, 10, 8, 30, 0, 0);

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

  describe('cancelByAdmin', () => {
    it('cancels with a reason even less than 2 hours before the start', () => {
      const appointment = Appointment.restore(buildProps());
      const now = new Date(2026, 0, 10, 9, 45, 0, 0);

      appointment.cancelByAdmin(now, 'Barber is sick');

      expect(appointment.getStatus()).toBe(AppointmentStatus.CANCELLED);
      expect(appointment.getCancelledAt()).toEqual(now);
      expect(appointment.getUpdatedAt()).toEqual(now);
      expect(appointment.getCancellationReason()).toBe('Barber is sick');
    });

    it('trims the reason before storing it', () => {
      const appointment = Appointment.restore(buildProps());

      appointment.cancelByAdmin(
        new Date(2026, 0, 10, 9, 0, 0, 0),
        '  Barber is sick  ',
      );

      expect(appointment.getCancellationReason()).toBe('Barber is sick');
    });

    it('throws CancellationReasonRequiredError when the reason is blank', () => {
      const appointment = Appointment.restore(buildProps());

      expect(() =>
        appointment.cancelByAdmin(new Date(2026, 0, 10, 9, 0, 0, 0), '   '),
      ).toThrow(CancellationReasonRequiredError);
    });

    it('throws AppointmentAlreadyCancelledError when already cancelled', () => {
      const appointment = Appointment.restore(
        buildProps({
          status: AppointmentStatus.CANCELLED,
          cancelledAt: new Date(2026, 0, 2, 0, 0, 0, 0),
        }),
      );

      expect(() =>
        appointment.cancelByAdmin(
          new Date(2026, 0, 5, 0, 0, 0, 0),
          'Any reason',
        ),
      ).toThrow(AppointmentAlreadyCancelledError);
    });
  });
});
