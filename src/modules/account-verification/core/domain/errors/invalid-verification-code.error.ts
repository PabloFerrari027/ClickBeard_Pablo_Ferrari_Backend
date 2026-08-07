import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class InvalidVerificationCodeError extends ValidationError {
  constructor() {
    super('Invalid verification code.');
  }
}
