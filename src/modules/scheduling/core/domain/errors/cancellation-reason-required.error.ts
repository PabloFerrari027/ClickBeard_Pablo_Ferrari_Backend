import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class CancellationReasonRequiredError extends ValidationError {
  constructor() {
    super('A cancellation reason is required.');
  }
}
