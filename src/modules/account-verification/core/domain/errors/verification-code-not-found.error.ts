import { DomainError } from './domain.error';

export class VerificationCodeNotFoundError extends DomainError {
  constructor() {
    super('No active verification code was found for this user.');
  }
}
