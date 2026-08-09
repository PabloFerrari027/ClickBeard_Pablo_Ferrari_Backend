import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class BarberCannotBookOwnAppointmentError extends ValidationError {
  constructor() {
    super('A barber cannot book an appointment with themselves.');
  }
}
