import { DomainError } from './domain.error';

export class InvalidHiringDateError extends DomainError {
  constructor() {
    super('The hiring date cannot be in the future.');
  }
}
