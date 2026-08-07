import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class InvalidNameError extends ValidationError {
  constructor() {
    super('The name must be at least 2 characters long.');
  }
}
