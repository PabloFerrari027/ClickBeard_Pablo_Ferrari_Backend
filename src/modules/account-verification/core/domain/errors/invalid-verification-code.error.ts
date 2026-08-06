import { DomainError } from './domain.error';

export class InvalidVerificationCodeError extends DomainError {
  constructor() {
    super('Invalid verification code.');
  }
}
