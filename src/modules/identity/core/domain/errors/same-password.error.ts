import { DomainError } from './domain.error';

export class SamePasswordError extends DomainError {
  constructor() {
    super('The new password must be different from the current password.');
  }
}
