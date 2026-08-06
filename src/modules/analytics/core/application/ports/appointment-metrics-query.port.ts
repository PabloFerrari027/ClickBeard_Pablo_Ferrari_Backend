import { DateRange } from '../../domain/value-objects/date-range.value-object';

export const APPOINTMENT_METRICS_QUERY = Symbol('AppointmentMetricsQuery');

export interface TimeSlotUsage {
  /** "HH:mm", aggregated across every day in the queried range. */
  startTime: string;
  total: number;
}

export interface DayOfWeekUsage {
  /** 0 (Sunday) - 6 (Saturday). */
  dayOfWeek: number;
  total: number;
}

/**
 * Analytics-owned read model over the Scheduling bounded context.
 */
export interface AppointmentMetricsQuery {
  countTotal(): Promise<number>;
  countInRange(range: DateRange): Promise<number>;
  countUpcoming(from: Date): Promise<number>;
  countCancelled(range?: DateRange): Promise<number>;
  /** Cancelled / total for the range, as a 0..1 ratio. */
  cancellationRate(range?: DateRange): Promise<number>;
  mostUsedTimeSlots(range: DateRange, limit: number): Promise<TimeSlotUsage[]>;
  busiestDaysOfWeek(range: DateRange, limit: number): Promise<DayOfWeekUsage[]>;
}
