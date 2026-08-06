import { DomainError } from './domain.error';

export class InvalidTimeSlotError extends DomainError {
  constructor() {
    super(
      'Appointments must start on a 30-minute boundary and fit within business hours (08:00-18:00).',
    );
  }
}
