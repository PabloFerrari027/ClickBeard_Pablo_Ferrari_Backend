import { ConflictError } from '../../../../../shared/domain/errors/conflict.error';

export class UserAlreadyDeactivatedError extends ConflictError {
  constructor() {
    super('The user is already deactivated.');
  }
}
