import { ForbiddenError } from '../../../../../shared/domain/errors/forbidden.error';

export class UserIsNotAdminError extends ForbiddenError {
  constructor() {
    super('Only administrators can access analytics data.');
  }
}
