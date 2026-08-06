import { DomainError } from './domain.error';

export class BarberAlreadyExistsError extends DomainError {
  constructor() {
    super('A barber profile already exists for this user.');
  }
}
