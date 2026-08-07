import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class InvalidDateRangeError extends ValidationError {
  constructor() {
    super('The range start date must not be after the end date.');
  }
}
