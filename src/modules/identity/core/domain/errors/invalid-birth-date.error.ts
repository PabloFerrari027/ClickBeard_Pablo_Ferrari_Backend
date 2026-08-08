import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class InvalidBirthDateError extends ValidationError {
  constructor() {
    super('The birth date must be a valid date that is not in the future.');
  }
}
