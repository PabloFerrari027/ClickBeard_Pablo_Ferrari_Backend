import { ConflictError } from '../../../../../shared/domain/errors/conflict.error';

export class BarberUnavailabilityOverlapError extends ConflictError {
  constructor() {
    super('This barber already has an overlapping unavailability period.');
  }
}
