import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class WeakPasswordError extends ValidationError {
  constructor() {
    super(
      'The password must be at least 8 characters long and include letters and numbers.',
    );
  }
}
