import { DomainError } from './domain.error';

export class InvalidNameError extends DomainError {
  constructor() {
    super('The name must be at least 2 characters long.');
  }
}
