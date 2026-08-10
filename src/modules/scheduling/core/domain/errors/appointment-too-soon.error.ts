import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class AppointmentTooSoonError extends ValidationError {
  constructor() {
    super('Appointments must be booked for a time in the future.');
  }
}
