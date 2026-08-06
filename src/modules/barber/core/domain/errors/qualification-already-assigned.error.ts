import { DomainError } from './domain.error';

export class QualificationAlreadyAssignedError extends DomainError {
  constructor() {
    super('This qualification is already assigned to the barber.');
  }
}
