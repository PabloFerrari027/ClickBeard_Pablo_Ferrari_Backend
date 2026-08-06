import { DomainError } from './domain.error';

export class RefreshTokenAlreadyRevokedError extends DomainError {
  constructor() {
    super('Refresh token has already been revoked.');
  }
}
