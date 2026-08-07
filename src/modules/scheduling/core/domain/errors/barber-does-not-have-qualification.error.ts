import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class BarberDoesNotHaveQualificationError extends ValidationError {
  constructor() {
    super('This barber does not have the requested qualification.');
  }
}
