import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class InvalidQualificationNameError extends ValidationError {
  constructor() {
    super('The qualification name must be at least 2 characters long.');
  }
}
