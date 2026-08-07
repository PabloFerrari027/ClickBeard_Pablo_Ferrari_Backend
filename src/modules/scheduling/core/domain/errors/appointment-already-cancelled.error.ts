import { ConflictError } from '../../../../../shared/domain/errors/conflict.error';

export class AppointmentAlreadyCancelledError extends ConflictError {
  constructor() {
    super('Appointment has already been cancelled.');
  }
}
