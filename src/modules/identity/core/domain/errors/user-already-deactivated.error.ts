import { DomainError } from './domain.error';

export class UserAlreadyDeactivatedError extends DomainError {
  constructor() {
    super('The user is already deactivated.');
  }
}
