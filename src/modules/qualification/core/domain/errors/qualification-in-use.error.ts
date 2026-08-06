import { DomainError } from './domain.error';

export class QualificationInUseError extends DomainError {
  constructor() {
    super(
      'This qualification is assigned to at least one barber and cannot be deleted.',
    );
  }
}
