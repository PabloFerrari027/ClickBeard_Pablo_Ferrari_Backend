/**
 * Builds the UTC instant for the given America/Sao_Paulo (fixed UTC-3)
 * wall-clock time, independent of the machine running the tests. Every
 * scheduling spec that needs a `Date` landing inside/outside business
 * hours must go through this instead of the local-timezone `Date`
 * constructor — `TimeSlot.create` anchors business hours to
 * BUSINESS_TIMEZONE_UTC_OFFSET (America/Sao_Paulo by default), so
 * `new Date(y, m, d, h, ...)` only produces the intended wall-clock time
 * when the machine running the test happens to already be in that
 * timezone (true on a dev machine set to America/Sao_Paulo, false on a
 * UTC CI runner).
 */
export function businessTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
  second = 0,
  ms = 0,
): Date {
  return new Date(Date.UTC(year, month, day, hour + 3, minute, second, ms));
}
