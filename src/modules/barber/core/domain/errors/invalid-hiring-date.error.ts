import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class InvalidHiringDateError extends ValidationError {
  constructor() {
    super('The hiring date cannot be in the future.');
  }
}
