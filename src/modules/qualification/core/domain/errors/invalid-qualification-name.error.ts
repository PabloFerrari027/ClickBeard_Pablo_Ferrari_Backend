import { DomainError } from './domain.error';

export class InvalidQualificationNameError extends DomainError {
  constructor() {
    super('The qualification name must be at least 2 characters long.');
  }
}
