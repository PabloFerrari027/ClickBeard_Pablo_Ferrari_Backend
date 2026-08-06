import { InvalidTimeSlotError } from '../errors/invalid-time-slot.error';
import { TimeSlot } from './time-slot.value-object';

describe('TimeSlot', () => {
  describe('create', () => {
    it('creates a slot ending 30 minutes after the given start', () => {
      const start = new Date(2026, 0, 5, 9, 0, 0, 0);

      const slot = TimeSlot.create(start);

      expect(slot.getStart()).toEqual(start);
      expect(slot.getEnd()).toEqual(new Date(2026, 0, 5, 9, 30, 0, 0));
    });

    it('accepts the earliest slot of the day (08:00)', () => {
      expect(() =>
        TimeSlot.create(new Date(2026, 0, 5, 8, 0, 0, 0)),
      ).not.toThrow();
    });

    it('accepts the latest slot of the day (17:30, ending exactly at 18:00)', () => {
      expect(() =>
        TimeSlot.create(new Date(2026, 0, 5, 17, 30, 0, 0)),
      ).not.toThrow();
    });

    it('rejects a start time before business hours', () => {
      expect(() => TimeSlot.create(new Date(2026, 0, 5, 7, 30, 0, 0))).toThrow(
        InvalidTimeSlotError,
      );
    });

    it('rejects a slot that would end after business hours', () => {
      expect(() => TimeSlot.create(new Date(2026, 0, 5, 17, 45, 0, 0))).toThrow(
        InvalidTimeSlotError,
      );
    });

    it('rejects a start time not aligned to the 30-minute grid', () => {
      expect(() => TimeSlot.create(new Date(2026, 0, 5, 9, 15, 0, 0))).toThrow(
        InvalidTimeSlotError,
      );
    });

    it('rejects a start time with non-zero seconds', () => {
      expect(() => TimeSlot.create(new Date(2026, 0, 5, 9, 0, 30, 0))).toThrow(
        InvalidTimeSlotError,
      );
    });
  });

  describe('allForDate', () => {
    it('generates 20 slots covering the full business day', () => {
      const slots = TimeSlot.allForDate(new Date(2026, 0, 5, 12, 0, 0, 0));

      expect(slots).toHaveLength(20);
      expect(slots[0].getStart()).toEqual(new Date(2026, 0, 5, 8, 0, 0, 0));
      expect(slots[slots.length - 1].getStart()).toEqual(
        new Date(2026, 0, 5, 17, 30, 0, 0),
      );
      expect(slots[slots.length - 1].getEnd()).toEqual(
        new Date(2026, 0, 5, 18, 0, 0, 0),
      );
    });
  });

  describe('equals', () => {
    it('returns true for slots with the same start time', () => {
      const a = TimeSlot.create(new Date(2026, 0, 5, 9, 0, 0, 0));
      const b = TimeSlot.create(new Date(2026, 0, 5, 9, 0, 0, 0));

      expect(a.equals(b)).toBe(true);
    });

    it('returns false for slots with a different start time', () => {
      const a = TimeSlot.create(new Date(2026, 0, 5, 9, 0, 0, 0));
      const b = TimeSlot.create(new Date(2026, 0, 5, 9, 30, 0, 0));

      expect(a.equals(b)).toBe(false);
    });
  });
});
