import { DomainError } from './domain.error';

export class UserIsNotAdminError extends DomainError {
  constructor() {
    super('Only an existing ADMIN can create or promote another ADMIN.');
  }
}
