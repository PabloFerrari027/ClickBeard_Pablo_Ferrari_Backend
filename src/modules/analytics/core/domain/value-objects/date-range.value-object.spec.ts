import { CustomRangeRequiredError } from '../errors/custom-range-required.error';
import { InvalidDateRangeError } from '../errors/invalid-date-range.error';
import { PeriodPreset } from '../enums/period-preset.enum';
import { DateRange } from './date-range.value-object';

const NOW = new Date(2026, 7, 6, 15, 30, 0);

describe('DateRange', () => {
  describe('create', () => {
    it('creates a range when start is before end', () => {
      const start = new Date(2026, 0, 1);
      const end = new Date(2026, 0, 31);

      const range = DateRange.create(start, end);

      expect(range.getStart()).toEqual(start);
      expect(range.getEnd()).toEqual(end);
    });

    it('creates a range when start equals end', () => {
      const instant = new Date(2026, 0, 1);

      const range = DateRange.create(instant, instant);

      expect(range.getStart()).toEqual(instant);
    });

    it('throws InvalidDateRangeError when start is after end', () => {
      const start = new Date(2026, 0, 31);
      const end = new Date(2026, 0, 1);

      expect(() => DateRange.create(start, end)).toThrow(InvalidDateRangeError);
    });
  });

  describe('fromPreset', () => {
    it('resolves TODAY to the calendar day of now', () => {
      const range = DateRange.fromPreset(PeriodPreset.TODAY, NOW);

      expect(range.getStart()).toEqual(new Date(2026, 7, 6, 0, 0, 0, 0));
      expect(range.getEnd()).toEqual(new Date(2026, 7, 6, 23, 59, 59, 999));
    });

    it('resolves WEEK to the Sunday-to-Saturday week of now', () => {
      const range = DateRange.fromPreset(PeriodPreset.WEEK, NOW);

      expect(range.getStart()).toEqual(new Date(2026, 7, 2, 0, 0, 0, 0));
      expect(range.getEnd()).toEqual(new Date(2026, 7, 8, 23, 59, 59, 999));
    });

    it('resolves MONTH to the calendar month of now', () => {
      const range = DateRange.fromPreset(PeriodPreset.MONTH, NOW);

      expect(range.getStart()).toEqual(new Date(2026, 7, 1, 0, 0, 0, 0));
      expect(range.getEnd()).toEqual(new Date(2026, 8, 1, 0, 0, 0, -1));
    });

    it('resolves YEAR to the calendar year of now', () => {
      const range = DateRange.fromPreset(PeriodPreset.YEAR, NOW);

      expect(range.getStart()).toEqual(new Date(2026, 0, 1, 0, 0, 0, 0));
      expect(range.getEnd()).toEqual(new Date(2027, 0, 1, 0, 0, 0, -1));
    });

    it('resolves CUSTOM to the given start/end', () => {
      const start = new Date(2026, 0, 1);
      const end = new Date(2026, 5, 30);

      const range = DateRange.fromPreset(PeriodPreset.CUSTOM, NOW, {
        start,
        end,
      });

      expect(range.getStart()).toEqual(start);
      expect(range.getEnd()).toEqual(end);
    });

    it('throws CustomRangeRequiredError when CUSTOM has no bounds', () => {
      expect(() => DateRange.fromPreset(PeriodPreset.CUSTOM, NOW)).toThrow(
        CustomRangeRequiredError,
      );
    });
  });

  describe('contains', () => {
    it('returns true for a date inside the range', () => {
      const range = DateRange.fromPreset(PeriodPreset.TODAY, NOW);

      expect(range.contains(NOW)).toBe(true);
    });

    it('returns false for a date outside the range', () => {
      const range = DateRange.fromPreset(PeriodPreset.TODAY, NOW);

      expect(range.contains(new Date(2026, 7, 7, 0, 0, 1))).toBe(false);
    });
  });
});
