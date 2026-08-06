import { DomainError } from './domain.error';

export class VerificationCodeAlreadyInvalidatedError extends DomainError {
  constructor() {
    super('Verification code has already been invalidated.');
  }
}
