import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class InvalidUnavailabilityPeriodError extends ValidationError {
  constructor() {
    super("The unavailability period's end must be after its start.");
  }
}
