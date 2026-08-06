export const BARBER_DIRECTORY = Symbol('BarberDirectory');

/**
 * Read-only snapshot of a Barber profile, as seen from the Scheduling
 * bounded context. Includes whether the barber can currently be booked
 * so callers never need a second lookup against Identity just to check
 * that — it's the adapter's job to resolve `active` from wherever it
 * actually lives (today, the underlying User's own active flag).
 */
export interface BarberSnapshot {
  id: string;
  qualificationIds: string[];
  active: boolean;
}

export interface BarberDirectory {
  findById(barberId: string): Promise<BarberSnapshot | null>;
}
