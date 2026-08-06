import { DomainError } from './domain.error';

export class VerificationNotCompletedError extends DomainError {
  constructor() {
    super('The verification code has not been successfully validated yet.');
  }
}
