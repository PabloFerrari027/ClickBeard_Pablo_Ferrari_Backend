import { DomainError } from './domain.error';

export class QualificationNotAssignedError extends DomainError {
  constructor() {
    super('This qualification is not assigned to the barber.');
  }
}
