import { TimeSlot } from '../../domain/value-objects/time-slot.value-object';

export const AVAILABILITY_SERVICE = Symbol('AvailabilityService');

/**
 * The "is this barber free" read path, kept separate from
 * AppointmentRepository so a future adapter can serve it from a
 * cache/read-model instead of scanning the appointments table directly.
 */
export interface AvailabilityService {
  isBarberAvailable(barberId: string, timeSlot: TimeSlot): Promise<boolean>;
  /** Active (non-cancelled) time slots already booked for a barber on a given day. */
  getBookedSlots(barberId: string, date: Date): Promise<TimeSlot[]>;
  /**
   * Whether the barber has an unavailability period (see the `barber`
   * module) covering this slot's start. Reads `barbers_unavailabilities`
   * directly by table name, the same read-only-port-over-SQL pattern
   * `BarberDirectory` already uses to stay decoupled from `barber`.
   */
  isBarberUnavailable(barberId: string, timeSlot: TimeSlot): Promise<boolean>;
  /** Every valid slot on the given day that falls inside an unavailability period for the barber. */
  getUnavailableSlots(barberId: string, date: Date): Promise<TimeSlot[]>;
}
