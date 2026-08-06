import { DomainError } from './domain.error';

export class UserIsNotAdminError extends DomainError {
  constructor() {
    super('Only users with the ADMIN role can manage qualifications.');
  }
}
