import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';

export class UserNotFoundError extends NotFoundError {
  constructor() {
    super('User not found.');
  }
}
