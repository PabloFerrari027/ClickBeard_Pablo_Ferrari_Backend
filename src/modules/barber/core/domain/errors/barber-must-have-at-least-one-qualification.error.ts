import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class BarberMustHaveAtLeastOneQualificationError extends ValidationError {
  constructor() {
    super('A barber must have at least one qualification.');
  }
}
