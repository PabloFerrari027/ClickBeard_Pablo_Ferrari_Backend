import { InvalidTimeSlotError } from '../errors/invalid-time-slot.error';

export const OPENING_HOUR = 8;
export const CLOSING_HOUR = 18;
export const APPOINTMENT_DURATION_MINUTES = 30;

/**
 * A fixed 30-minute window that fits within business hours (08:00-18:00),
 * aligned to the 30-minute grid. Purely structural — whether the slot is
 * still in the future is a separate concern for callers, resolved
 * against whatever `Date` they treat as "now".
 */
export class TimeSlot {
  private readonly start: Date;
  private readonly end: Date;

  private constructor(start: Date, end: Date) {
    this.start = start;
    this.end = end;
  }

  static create(start: Date): TimeSlot {
    const startMinutesOfDay = start.getHours() * 60 + start.getMinutes();
    const isGridAligned =
      startMinutesOfDay % APPOINTMENT_DURATION_MINUTES === 0 &&
      start.getSeconds() === 0 &&
      start.getMilliseconds() === 0;

    const end = new Date(
      start.getTime() + APPOINTMENT_DURATION_MINUTES * 60_000,
    );
    const endMinutesOfDay = end.getHours() * 60 + end.getMinutes();

    const isWithinBusinessHours =
      end.getDate() === start.getDate() &&
      startMinutesOfDay >= OPENING_HOUR * 60 &&
      endMinutesOfDay <= CLOSING_HOUR * 60;

    if (!isGridAligned || !isWithinBusinessHours) {
      throw new InvalidTimeSlotError();
    }

    return new TimeSlot(start, end);
  }

  /** Every valid 30-minute slot for the calendar day of the given date. */
  static allForDate(date: Date): TimeSlot[] {
    const slotsPerDay =
      ((CLOSING_HOUR - OPENING_HOUR) * 60) / APPOINTMENT_DURATION_MINUTES;
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      OPENING_HOUR,
      0,
      0,
      0,
    );

    return Array.from({ length: slotsPerDay }, (_, index) =>
      TimeSlot.create(
        new Date(
          startOfDay.getTime() + index * APPOINTMENT_DURATION_MINUTES * 60_000,
        ),
      ),
    );
  }

  equals(other: TimeSlot): boolean {
    return this.start.getTime() === other.start.getTime();
  }

  getStart(): Date {
    return this.start;
  }

  getEnd(): Date {
    return this.end;
  }
}
