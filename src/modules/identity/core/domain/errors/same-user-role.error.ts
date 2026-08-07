import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class SameUserRoleError extends ValidationError {
  constructor() {
    super('The new role must be different from the current role.');
  }
}
