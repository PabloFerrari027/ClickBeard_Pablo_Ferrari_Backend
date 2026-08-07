import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class UserIsNotBarberError extends ValidationError {
  constructor() {
    super('The user must have the BARBER role to have a barber profile.');
  }
}
