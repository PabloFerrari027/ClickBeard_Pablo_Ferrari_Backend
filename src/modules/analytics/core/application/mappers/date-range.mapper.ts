import { DateRangeFilterDto } from '../dtos/date-range-filter.dto';
import { DateRange } from '../../domain/value-objects/date-range.value-object';
import { Clock } from '../../../../../shared/application/ports/clock.port';

export function toDateRange(
  filter: DateRangeFilterDto,
  clock: Clock,
): DateRange {
  const custom =
    filter.startAt && filter.endAt
      ? { start: filter.startAt, end: filter.endAt }
      : undefined;

  return DateRange.fromPreset(filter.preset, clock.now(), custom);
}
