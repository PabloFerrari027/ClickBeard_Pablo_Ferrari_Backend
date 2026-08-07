import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class SamePasswordError extends ValidationError {
  constructor() {
    super('The new password must be different from the current password.');
  }
}
