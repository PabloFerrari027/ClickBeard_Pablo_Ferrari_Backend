import { DomainError } from './domain.error';

export class VerificationCodeAlreadyUsedError extends DomainError {
  constructor() {
    super('Verification code has already been used.');
  }
}
