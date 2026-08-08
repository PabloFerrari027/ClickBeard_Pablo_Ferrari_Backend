import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class UnavailabilityReasonRequiredError extends ValidationError {
  constructor() {
    super('A reason is required to mark a barber as unavailable.');
  }
}
