import { DomainError } from './domain.error';

export class AdminCannotBeDeactivatedError extends DomainError {
  constructor() {
    super('An admin cannot be deactivated.');
  }
}
