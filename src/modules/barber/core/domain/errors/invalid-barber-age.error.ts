import { DomainError } from './domain.error';

export class InvalidBarberAgeError extends DomainError {
  constructor() {
    super('The barber age must be an integer between 18 and 100.');
  }
}
