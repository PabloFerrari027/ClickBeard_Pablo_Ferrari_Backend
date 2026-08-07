import { ConflictError } from '../../../../../shared/domain/errors/conflict.error';

export class BarberTimeSlotConflictError extends ConflictError {
  constructor() {
    super('This barber already has an appointment at the selected time.');
  }
}
