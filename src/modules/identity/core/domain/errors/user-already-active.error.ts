import { ConflictError } from '../../../../../shared/domain/errors/conflict.error';

export class UserAlreadyActiveError extends ConflictError {
  constructor() {
    super('The user is already active.');
  }
}
