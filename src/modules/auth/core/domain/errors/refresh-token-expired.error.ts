import { UnauthorizedError } from '../../../../../shared/domain/errors/unauthorized.error';

export class RefreshTokenExpiredError extends UnauthorizedError {
  constructor() {
    super('Refresh token has expired.');
  }
}
