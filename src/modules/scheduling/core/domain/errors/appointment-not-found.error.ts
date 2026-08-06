import { DomainError } from './domain.error';

export class AppointmentNotFoundError extends DomainError {
  constructor() {
    super('Appointment not found.');
  }
}
