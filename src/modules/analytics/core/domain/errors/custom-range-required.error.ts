import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class CustomRangeRequiredError extends ValidationError {
  constructor() {
    super('A custom date range requires both a start and an end date.');
  }
}
