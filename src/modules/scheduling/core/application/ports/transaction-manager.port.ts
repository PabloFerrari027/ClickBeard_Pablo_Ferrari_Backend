export const TRANSACTION_MANAGER = Symbol('TransactionManager');

/**
 * Runs a unit of work atomically. CreateAppointmentUseCase wraps its
 * check-then-write (is the barber free? then save) in this, but a
 * transaction alone does not rule out two concurrent bookings for the
 * same barber/slot both passing the check under READ COMMITTED — the
 * adapter backing AppointmentRepository must also enforce a uniqueness
 * constraint on (barberId, startAt) for non-cancelled appointments, and
 * translate a violation of it into BarberTimeSlotConflictError. This
 * transaction is what makes that failure atomic with the write, not
 * what prevents the race by itself.
 */
export interface TransactionManager {
  runInTransaction<T>(work: () => Promise<T>): Promise<T>;
}
