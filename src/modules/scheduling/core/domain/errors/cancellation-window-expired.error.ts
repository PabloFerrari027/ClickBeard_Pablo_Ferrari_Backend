import { DomainError } from './domain.error';

export class CancellationWindowExpiredError extends DomainError {
  constructor() {
    super('Appointments can only be cancelled at least 2 hours in advance.');
  }
}
