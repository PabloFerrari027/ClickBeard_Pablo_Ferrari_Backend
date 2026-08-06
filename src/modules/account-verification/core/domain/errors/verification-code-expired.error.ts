import { DomainError } from './domain.error';

export class VerificationCodeExpiredError extends DomainError {
  constructor() {
    super('Verification code has expired.');
  }
}
