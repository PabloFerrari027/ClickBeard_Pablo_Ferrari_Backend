export const BARBER_DIRECTORY = Symbol('BarberDirectory');

/**
 * Read-only snapshot of a Barber profile, as seen from the Scheduling
 * bounded context. Includes whether the barber can currently be booked
 * so callers never need a second lookup against Identity/Barber just to
 * check that — it's the adapter's job to resolve `active` from wherever
 * it actually lives (today, both the underlying User's own active flag
 * and the Barber profile's own active flag — a demoted-then-deactivated
 * barber must be unbookable even if their user account itself is still
 * active).
 */
export interface BarberSnapshot {
  id: string;
  qualificationIds: string[];
  active: boolean;
}

export interface BarberDirectory {
  findById(barberId: string): Promise<BarberSnapshot | null>;
}
