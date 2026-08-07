import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class VerificationNotCompletedError extends ValidationError {
  constructor() {
    super('The verification code has not been successfully validated yet.');
  }
}
