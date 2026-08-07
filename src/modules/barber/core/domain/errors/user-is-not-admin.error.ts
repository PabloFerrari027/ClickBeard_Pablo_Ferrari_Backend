import { ForbiddenError } from '../../../../../shared/domain/errors/forbidden.error';

export class UserIsNotAdminError extends ForbiddenError {
  constructor() {
    super('Only users with the ADMIN role can manage barbers.');
  }
}
