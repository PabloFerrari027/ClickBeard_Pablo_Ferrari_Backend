import { DomainError } from './domain.error';

export class RefreshTokenExpiredError extends DomainError {
  constructor() {
    super('Refresh token has expired.');
  }
}
