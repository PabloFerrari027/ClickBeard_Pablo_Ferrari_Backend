import { InvalidTimeSlotError } from '../errors/invalid-time-slot.error';

export const OPENING_HOUR = 8;
export const CLOSING_HOUR = 18;
export const APPOINTMENT_DURATION_MINUTES = 30;

/**
 * America/Sao_Paulo has been fixed at UTC-3 since Brazil abolished DST in
 * 2019 — the default below. Business hours are anchored to this offset
 * explicitly, via UTC-only Date arithmetic, so they mean the same
 * wall-clock time regardless of the timezone the server process happens to
 * run in (e.g. a container defaulting to UTC) — relying on the process's
 * local timezone previously made OPENING_HOUR/CLOSING_HOUR shift by however
 * far that timezone was from Brazil's.
 */
const DEFAULT_BUSINESS_TIMEZONE_UTC_OFFSET_MINUTES = -180;

let businessTimezoneUtcOffsetMinutes =
  DEFAULT_BUSINESS_TIMEZONE_UTC_OFFSET_MINUTES;

/**
 * Overrides the UTC offset (in minutes) business hours are anchored to.
 * Called once at bootstrap from `configureApp`, sourced from the
 * `BUSINESS_TIMEZONE_UTC_OFFSET` env var — never call this mid-request.
 */
export function configureBusinessTimezone(offsetMinutes: number): void {
  businessTimezoneUtcOffsetMinutes = offsetMinutes;
}

interface BusinessLocalParts {
  year: number;
  month: number;
  date: number;
  minutesOfDay: number;
  seconds: number;
  milliseconds: number;
}

function toBusinessLocalParts(instant: Date): BusinessLocalParts {
  const shifted = new Date(
    instant.getTime() + businessTimezoneUtcOffsetMinutes * 60_000,
  );

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    date: shifted.getUTCDate(),
    minutesOfDay: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
    seconds: shifted.getUTCSeconds(),
    milliseconds: shifted.getUTCMilliseconds(),
  };
}

/** The UTC instant of `minutesOfDay` on the business-timezone calendar day `year/month/date`. */
function fromBusinessLocalMinutes(
  year: number,
  month: number,
  date: number,
  minutesOfDay: number,
): Date {
  return new Date(
    Date.UTC(year, month, date, 0, minutesOfDay, 0, 0) -
      businessTimezoneUtcOffsetMinutes * 60_000,
  );
}

/** [start, end) UTC bounds of `date`'s business-timezone (America/Sao_Paulo) calendar day. */
export function getBusinessDayBounds(date: Date): { start: Date; end: Date } {
  const { year, month, date: day } = toBusinessLocalParts(date);

  return {
    start: fromBusinessLocalMinutes(year, month, day, 0),
    end: fromBusinessLocalMinutes(year, month, day + 1, 0),
  };
}

/**
 * Parses a `YYYY-MM-DD` calendar-day selector (e.g. a `?date=` query
 * param) as business-timezone midnight of that day — NOT as a UTC
 * instant. `new Date('2026-01-11')` parses to 2026-01-11T00:00:00 UTC,
 * which `getBusinessDayBounds` (offset -03:00) resolves back to
 * 2026-01-10 business-local — the caller's requested day, off by one.
 * Every caller that means "give me this calendar day" (not "give me
 * whatever day this instant falls on") must go through this instead of
 * `new Date(dateOnly)`.
 */
export function parseBusinessCalendarDate(dateOnly: string): Date {
  const [year, month, day] = dateOnly.slice(0, 10).split('-').map(Number);

  return fromBusinessLocalMinutes(year, month - 1, day, 0);
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/**
 * Renders `instant` as `DD/MM/YYYY HH:mm` on the business-timezone
 * calendar/clock, for display in customer-facing text (e.g. notification
 * emails). `.toISOString()` shows the raw UTC instant, which reads as the
 * wrong wall-clock time to anyone in America/Sao_Paulo.
 */
export function formatBusinessDateTime(instant: Date): string {
  const { year, month, date, minutesOfDay } = toBusinessLocalParts(instant);
  const hours = Math.floor(minutesOfDay / 60);
  const minutes = minutesOfDay % 60;

  return `${pad(date)}/${pad(month + 1)}/${year} ${pad(hours)}:${pad(minutes)}`;
}

/**
 * A fixed 30-minute window that fits within business hours (08:00-18:00
 * America/Sao_Paulo), aligned to the 30-minute grid. Purely structural —
 * whether the slot is still in the future is a separate concern for
 * callers, resolved against whatever `Date` they treat as "now".
 */
export class TimeSlot {
  private readonly start: Date;
  private readonly end: Date;

  private constructor(start: Date, end: Date) {
    this.start = start;
    this.end = end;
  }

  static create(start: Date): TimeSlot {
    const startLocal = toBusinessLocalParts(start);
    const isGridAligned =
      startLocal.minutesOfDay % APPOINTMENT_DURATION_MINUTES === 0 &&
      startLocal.seconds === 0 &&
      startLocal.milliseconds === 0;

    const end = new Date(
      start.getTime() + APPOINTMENT_DURATION_MINUTES * 60_000,
    );
    const endLocal = toBusinessLocalParts(end);

    const isWithinBusinessHours =
      endLocal.year === startLocal.year &&
      endLocal.month === startLocal.month &&
      endLocal.date === startLocal.date &&
      startLocal.minutesOfDay >= OPENING_HOUR * 60 &&
      endLocal.minutesOfDay <= CLOSING_HOUR * 60;

    if (!isGridAligned || !isWithinBusinessHours) {
      throw new InvalidTimeSlotError();
    }

    return new TimeSlot(start, end);
  }

  /**
   * Reconstructs a slot already persisted as valid, without re-running
   * `create`'s business-hours/grid checks. Those checks are a booking-time
   * gate, not an invariant of stored data — re-validating on every read
   * means any later change to business hours (or the timezone they're
   * anchored to) retroactively "invalidates" old rows and 500s every list
   * endpoint that reads them, instead of just affecting new bookings.
   */
  static restore(start: Date, end: Date): TimeSlot {
    return new TimeSlot(start, end);
  }

  /** Every valid 30-minute slot for the business-timezone calendar day of the given date. */
  static allForDate(date: Date): TimeSlot[] {
    const slotsPerDay =
      ((CLOSING_HOUR - OPENING_HOUR) * 60) / APPOINTMENT_DURATION_MINUTES;
    const { start: startOfDay } = getBusinessDayBounds(date);
    const openingInstant = new Date(
      startOfDay.getTime() + OPENING_HOUR * 60 * 60_000,
    );

    return Array.from({ length: slotsPerDay }, (_, index) =>
      TimeSlot.create(
        new Date(
          openingInstant.getTime() +
            index * APPOINTMENT_DURATION_MINUTES * 60_000,
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
