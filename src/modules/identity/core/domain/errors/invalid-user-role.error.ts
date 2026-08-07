import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class InvalidUserRoleError extends ValidationError {
  constructor(role: string) {
    super(`The role "${role}" is not valid.`);
  }
}
