import { DomainError } from './domain.error';

export class SameUserRoleError extends DomainError {
  constructor() {
    super('The new role must be different from the current role.');
  }
}
