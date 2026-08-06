import { DomainError } from './domain.error';

export class AppointmentAlreadyCancelledError extends DomainError {
  constructor() {
    super('Appointment has already been cancelled.');
  }
}
