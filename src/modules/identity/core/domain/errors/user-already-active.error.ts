import { DomainError } from './domain.error';

export class UserAlreadyActiveError extends DomainError {
  constructor() {
    super('The user is already active.');
  }
}
