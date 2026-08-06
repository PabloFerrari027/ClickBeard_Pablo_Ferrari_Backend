import { DomainError } from './domain.error';

export class BarberNotFoundError extends DomainError {
  constructor() {
    super('Barber not found.');
  }
}
