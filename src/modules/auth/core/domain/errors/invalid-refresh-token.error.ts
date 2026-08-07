import { UnauthorizedError } from '../../../../../shared/domain/errors/unauthorized.error';

export class InvalidRefreshTokenError extends UnauthorizedError {
  constructor() {
    super('Invalid refresh token.');
  }
}
