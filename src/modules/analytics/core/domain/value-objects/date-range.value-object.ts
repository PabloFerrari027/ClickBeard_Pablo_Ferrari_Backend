import { CustomRangeRequiredError } from '../errors/custom-range-required.error';
import { InvalidDateRangeError } from '../errors/invalid-date-range.error';
import { PeriodPreset } from '../enums/period-preset.enum';
import { MS_PER_DAY } from '../../../../../shared/utils/time.constants';

/**
 * An inclusive [start, end] window used to scope every analytics query.
 * Presets are resolved relative to a caller-supplied `now` (never
 * `new Date()` internally) so this stays deterministic and testable
 * independent of whatever the calling use case does for "now",
 * exactly like TimeSlot does in the Scheduling module.
 */
export class DateRange {
  private constructor(
    private readonly start: Date,
    private readonly end: Date,
  ) {}

  static create(start: Date, end: Date): DateRange {
    if (start.getTime() > end.getTime()) {
      throw new InvalidDateRangeError();
    }

    return new DateRange(start, end);
  }

  static fromPreset(
    preset: PeriodPreset,
    now: Date,
    custom?: { start: Date; end: Date },
  ): DateRange {
    switch (preset) {
      case PeriodPreset.TODAY:
        return DateRange.dayOf(now);
      case PeriodPreset.WEEK:
        return DateRange.weekOf(now);
      case PeriodPreset.MONTH:
        return DateRange.monthOf(now);
      case PeriodPreset.YEAR:
        return DateRange.yearOf(now);
      case PeriodPreset.CUSTOM: {
        if (!custom) {
          throw new CustomRangeRequiredError();
        }

        return DateRange.create(custom.start, custom.end);
      }
    }
  }

  private static dayOf(now: Date): DateRange {
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const end = new Date(start.getTime() + MS_PER_DAY - 1);

    return new DateRange(start, end);
  }

  private static weekOf(now: Date): DateRange {
    const start = DateRange.dayOf(now).getStart();
    const daysSinceSunday = start.getDay();
    const weekStart = new Date(start.getTime() - daysSinceSunday * MS_PER_DAY);
    const weekEnd = new Date(weekStart.getTime() + 7 * MS_PER_DAY - 1);

    return new DateRange(weekStart, weekEnd);
  }

  private static monthOf(now: Date): DateRange {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, -1);

    return new DateRange(start, end);
  }

  private static yearOf(now: Date): DateRange {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, -1);

    return new DateRange(start, end);
  }

  contains(date: Date): boolean {
    return (
      date.getTime() >= this.start.getTime() &&
      date.getTime() <= this.end.getTime()
    );
  }

  getStart(): Date {
    return this.start;
  }

  getEnd(): Date {
    return this.end;
  }
}
