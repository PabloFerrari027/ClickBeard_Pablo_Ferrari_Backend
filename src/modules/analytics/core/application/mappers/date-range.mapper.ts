import { DateRangeFilterDto } from '../dtos/date-range-filter.dto';
import { DateRange } from '../../domain/value-objects/date-range.value-object';

export function toDateRange(filter: DateRangeFilterDto, now: Date): DateRange {
  const custom =
    filter.startAt && filter.endAt
      ? { start: filter.startAt, end: filter.endAt }
      : undefined;

  return DateRange.fromPreset(filter.preset, now, custom);
}
