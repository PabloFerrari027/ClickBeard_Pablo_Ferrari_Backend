import { getBusinessDayBounds } from '../../core/domain/value-objects/time-slot.value-object';

/** [start, end) bounds of `date`'s business-timezone (America/Sao_Paulo) calendar day, for `start_at` range queries. */
export function getDayRange(date: Date): { start: Date; end: Date } {
  return getBusinessDayBounds(date);
}
