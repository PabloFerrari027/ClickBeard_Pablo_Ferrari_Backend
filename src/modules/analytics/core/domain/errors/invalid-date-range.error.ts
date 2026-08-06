import { DomainError } from './domain.error';

export class InvalidDateRangeError extends DomainError {
  constructor() {
    super('The range start date must not be after the end date.');
  }
}
