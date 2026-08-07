import { ForbiddenError } from '../../../../../shared/domain/errors/forbidden.error';

export class AppointmentAccessDeniedError extends ForbiddenError {
  constructor() {
    super('You do not have access to this appointment.');
  }
}
