import { DomainError } from './domain.error';

export class UserIsNotBarberError extends DomainError {
  constructor() {
    super('The user must have the BARBER role to have a barber profile.');
  }
}
