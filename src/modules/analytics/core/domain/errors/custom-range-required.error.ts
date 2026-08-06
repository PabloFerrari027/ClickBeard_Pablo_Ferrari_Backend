import { DomainError } from './domain.error';

export class CustomRangeRequiredError extends DomainError {
  constructor() {
    super('A custom date range requires both a start and an end date.');
  }
}
