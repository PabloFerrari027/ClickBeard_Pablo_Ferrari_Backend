import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class InvalidAppointmentPeriodError extends ValidationError {
  constructor() {
    super('The period start date must not be after the end date.');
  }
}
