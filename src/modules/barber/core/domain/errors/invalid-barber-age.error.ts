import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class InvalidBarberAgeError extends ValidationError {
  constructor() {
    super('The barber age must be an integer between 18 and 100.');
  }
}
