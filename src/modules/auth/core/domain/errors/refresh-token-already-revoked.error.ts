import { UnauthorizedError } from '../../../../../shared/domain/errors/unauthorized.error';

export class RefreshTokenAlreadyRevokedError extends UnauthorizedError {
  constructor() {
    super('Refresh token has already been revoked.');
  }
}
