import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class AdminCannotBecomeBarberError extends ValidationError {
  constructor() {
    super('An admin cannot become a barber.');
  }
}
