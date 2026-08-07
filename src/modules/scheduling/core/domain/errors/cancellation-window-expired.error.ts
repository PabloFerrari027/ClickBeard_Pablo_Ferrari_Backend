import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class CancellationWindowExpiredError extends ValidationError {
  constructor() {
    super('Appointments can only be cancelled at least 2 hours in advance.');
  }
}
