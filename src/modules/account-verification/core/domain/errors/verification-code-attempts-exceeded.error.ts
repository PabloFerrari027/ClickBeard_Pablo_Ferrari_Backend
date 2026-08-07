import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class VerificationCodeAttemptsExceededError extends ValidationError {
  constructor() {
    super('Maximum verification attempts exceeded.');
  }
}
