import { ConflictError } from '../../../../../shared/domain/errors/conflict.error';

export class VerificationCodeAlreadyInvalidatedError extends ConflictError {
  constructor() {
    super('Verification code has already been invalidated.');
  }
}
