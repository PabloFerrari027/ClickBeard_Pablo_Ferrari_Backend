import { ForbiddenError } from '../../../../../shared/domain/errors/forbidden.error';

export class UserIsNotAdminError extends ForbiddenError {
  constructor() {
    super('Requester is not an admin.');
  }
}
