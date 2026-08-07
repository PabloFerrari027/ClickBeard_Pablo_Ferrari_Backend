import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class AdminCannotBeDeactivatedError extends ValidationError {
  constructor() {
    super('An admin cannot be deactivated.');
  }
}
