import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class InvalidTimeSlotError extends ValidationError {
  constructor() {
    super(
      'Appointments must start on a 30-minute boundary and fit within business hours (08:00-18:00).',
    );
  }
}
