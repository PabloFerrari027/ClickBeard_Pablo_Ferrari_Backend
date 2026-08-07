import { BarberUnavailability } from '../../domain/entities/barber-unavailability.entity';

export const BARBER_UNAVAILABILITY_REPOSITORY = Symbol(
  'BarberUnavailabilityRepository',
);

export interface BarberUnavailabilityRepository {
  save(unavailability: BarberUnavailability): Promise<void>;
  findById(id: string): Promise<BarberUnavailability | null>;
  listByBarberId(barberId: string): Promise<BarberUnavailability[]>;
  /**
   * Application-level pre-check only — there is no database constraint
   * backing this (a range-overlap uniqueness isn't expressible as a
   * simple unique index, unlike appointments' single-instant slot
   * uniqueness). A concurrent create can still race past this check;
   * accepted as a low-frequency admin action, not a booking hot path.
   */
  existsOverlapping(
    barberId: string,
    startAt: Date,
    endAt: Date,
  ): Promise<boolean>;
  delete(id: string): Promise<void>;
}
