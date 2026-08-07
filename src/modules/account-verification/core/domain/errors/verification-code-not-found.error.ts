import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';

export class VerificationCodeNotFoundError extends NotFoundError {
  constructor() {
    super('No active verification code was found for this user.');
  }
}
