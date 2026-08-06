import { DomainError } from './domain.error';

export class UserIsNotAdminError extends DomainError {
  constructor() {
    super('Only administrators can access analytics data.');
  }
}
