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

  private static dateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
