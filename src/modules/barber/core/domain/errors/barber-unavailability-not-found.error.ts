import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';

export class BarberUnavailabilityNotFoundError extends NotFoundError {
  constructor() {
    super('Unavailability period not found.');
  }
}
