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
}
