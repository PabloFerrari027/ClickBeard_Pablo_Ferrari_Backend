import { DomainError } from './domain.error';

export class BarberDoesNotHaveQualificationError extends DomainError {
  constructor() {
    super('This barber does not have the requested qualification.');
  }
}
