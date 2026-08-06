import { DomainError } from './domain.error';

export class BarberMustHaveAtLeastOneQualificationError extends DomainError {
  constructor() {
    super('A barber must have at least one qualification.');
  }
}
