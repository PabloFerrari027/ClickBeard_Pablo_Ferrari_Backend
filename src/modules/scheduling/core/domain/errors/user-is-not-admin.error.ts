import { DomainError } from './domain.error';

export class UserIsNotAdminError extends DomainError {
  constructor() {
    super('Requester is not an admin.');
  }
}
