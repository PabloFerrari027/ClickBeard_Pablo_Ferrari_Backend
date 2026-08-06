import { DomainError } from './domain.error';

export class VerificationCodeAttemptsExceededError extends DomainError {
  constructor() {
    super('Maximum verification attempts exceeded.');
  }
}
