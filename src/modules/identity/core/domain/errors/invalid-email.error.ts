import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class InvalidEmailError extends ValidationError {
  constructor(email: string) {
    super(`The email "${email}" is invalid.`);
  }
}
