import { ConflictError } from '../../../../../shared/domain/errors/conflict.error';

export class UserAlreadyExistsError extends ConflictError {
  constructor(email: string) {
    super(`A user with the email "${email}" already exists.`);
  }
}
