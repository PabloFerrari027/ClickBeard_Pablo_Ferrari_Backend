import { DomainError } from './domain.error';

export class QualificationNotFoundError extends DomainError {
  constructor() {
    super('Qualification not found.');
  }
}
