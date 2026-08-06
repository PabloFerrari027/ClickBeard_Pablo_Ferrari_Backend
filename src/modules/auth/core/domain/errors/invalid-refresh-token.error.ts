import { DomainError } from './domain.error';

export class InvalidRefreshTokenError extends DomainError {
  constructor() {
    super('Invalid refresh token.');
  }
}
