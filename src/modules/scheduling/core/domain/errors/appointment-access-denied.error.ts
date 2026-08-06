import { DomainError } from './domain.error';

export class AppointmentAccessDeniedError extends DomainError {
  constructor() {
    super('You do not have access to this appointment.');
  }
}
