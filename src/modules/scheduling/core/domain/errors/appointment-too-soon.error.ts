import { DomainError } from './domain.error';

export class AppointmentTooSoonError extends DomainError {
  constructor() {
    super('Appointments must be booked at least 2 hours in advance.');
  }
}
