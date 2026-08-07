import { ForbiddenError } from '../../../../../shared/domain/errors/forbidden.error';

export class UserIsNotAdminError extends ForbiddenError {
  constructor() {
    super('Only an existing ADMIN can create or promote another ADMIN.');
  }
}
