import { DomainError } from './domain.error';

export class BarberTimeSlotConflictError extends DomainError {
  constructor() {
    super('This barber already has an appointment at the selected time.');
  }
}
