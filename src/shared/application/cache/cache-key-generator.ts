import { CacheKey } from './cache-key';
import { CacheKeyPrefix } from './cache-key-prefix';

/**
 * The single place every cache key format is defined. No use-case
 * wiring should ever build a cache key string by hand — this keeps the
 * format for a given resource (and the prefixes used to bulk-invalidate
 * it) consistent and greppable in one file.
 */
export class CacheKeyGenerator {
  static userProfile(userId: string): CacheKey {
    return CacheKey.of(`user:${userId}`);
  }

  static usersList(page: number): CacheKey {
    return CacheKey.of(`users:list:${page}`);
  }

  static usersListPrefix(): CacheKeyPrefix {
    return CacheKeyPrefix.of('users:list:');
  }

  static barber(barberId: string): CacheKey {
    return CacheKey.of(`barber:${barberId}`);
  }

  static barbersList(page: number): CacheKey {
    return CacheKey.of(`barbers:list:${page}`);
  }

  static barbersListPrefix(): CacheKeyPrefix {
    return CacheKeyPrefix.of('barbers:list:');
  }

  static qualifications(): CacheKey {
    return CacheKey.of('qualifications');
  }

  /**
   * Scoped to the requester: GetAppointment enforces "owner or admin"
   * inside the use case itself (no controller guard exists for
   * Scheduling yet), so a cache hit must never let one caller ride on
   * another caller's already-authorized result.
   */
  static appointment(appointmentId: string, requesterId: string): CacheKey {
    return CacheKey.of(`appointment:${appointmentId}:${requesterId}`);
  }

  static appointmentPrefix(appointmentId: string): CacheKeyPrefix {
    return CacheKeyPrefix.of(`appointment:${appointmentId}:`);
  }

  static customerAppointments(customerId: string, page: number): CacheKey {
    return CacheKey.of(`appointments:${customerId}:${page}`);
  }

  static customerAppointmentsPrefix(customerId: string): CacheKeyPrefix {
    return CacheKeyPrefix.of(`appointments:${customerId}:`);
  }

  /**
   * Not scoped by requester: `AppointmentsController`'s `@Auth(UserRole.ADMIN)`
   * gates the route before any cached use case runs, and the result is
   * identical for every admin — same reasoning as Analytics's metrics keys.
   */
  static todayAppointments(page: number): CacheKey {
    return CacheKey.of(`appointments:today:${page}`);
  }

  static todayAppointmentsPrefix(): CacheKeyPrefix {
    return CacheKeyPrefix.of('appointments:today:');
  }

  /**
   * `startAt`/`endAt` fold into the key (ISO instants, `-` when absent)
   * so different period filters on the same page never collide on the
   * same cache entry.
   */
  static futureAppointments(page: number, startAt?: Date, endAt?: Date): CacheKey {
    const start = startAt ? startAt.toISOString() : '-';
    const end = endAt ? endAt.toISOString() : '-';

    return CacheKey.of(`appointments:future:${page}:${start}:${end}`);
  }

  static futureAppointmentsPrefix(): CacheKeyPrefix {
    return CacheKeyPrefix.of('appointments:future:');
  }

  static availableTimeSlots(
    barberId: string,
    date: Date,
    qualificationId: string,
  ): CacheKey {
    return CacheKey.of(
      `time-slots:${barberId}:${CacheKeyGenerator.dateOnly(date)}:${qualificationId}`,
    );
  }

  /** Every qualification's slots for a barber's day, invalidated together since a booking blocks the day regardless of qualification. */
  static barberTimeSlotsPrefix(barberId: string, date: Date): CacheKeyPrefix {
    return CacheKeyPrefix.of(
      `time-slots:${barberId}:${CacheKeyGenerator.dateOnly(date)}:`,
    );
  }

  /**
   * Every date's slots for a barber, not just one day — used when a
   * barber unavailability period is created/removed, since it can span
   * multiple calendar days and there is no single `date` to scope the
   * invalidation to the way `barberTimeSlotsPrefix` does.
   */
  static barberAllTimeSlotsPrefix(barberId: string): CacheKeyPrefix {
    return CacheKeyPrefix.of(`time-slots:${barberId}:`);
  }

  static dashboardMetrics(period: string): CacheKey {
    return CacheKey.of(`dashboard:${period}`);
  }

  static metrics(type: string, period: string): CacheKey {
    return CacheKey.of(`metrics:${type}:${period}`);
  }

  static customerMetrics(period: string, customerId?: string): CacheKey {
    return CacheKey.of(`metrics:customers:${period}:${customerId ?? 'all'}`);
  }

  /** Collapses a filter preset (+ optional custom bounds) into one stable string for use inside a metrics/dashboard key. */
  static periodKey(preset: string, startAt?: Date, endAt?: Date): string {
    return startAt && endAt
      ? `${preset}:${startAt.toISOString()}:${endAt.toISOString()}`
      : preset;
  }

  /**
   * Must bucket by the same calendar day `TimeSlot.allForDate` uses
   * (server-local `getFullYear`/`getMonth`/`getDate`), not UTC — on a
   * negative-UTC-offset server, a UTC-based bucket here would put the
   * booking use case's invalidation (keyed off the appointment's actual
   * `startAt`) on a different day than the list use case's cache entry
   * (keyed off the query's date), leaving a stale, already-booked slot
   * visible after booking.
   */
  private static dateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
