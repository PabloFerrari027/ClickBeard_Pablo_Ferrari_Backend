import { ConflictError } from '../../../../../shared/domain/errors/conflict.error';

export class VerificationCodeAlreadyUsedError extends ConflictError {
  constructor() {
    super('Verification code has already been used.');
  }
}
