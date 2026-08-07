import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class VerificationCodeExpiredError extends ValidationError {
  constructor() {
    super('Verification code has expired.');
  }
}
