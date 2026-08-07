import { ConflictError } from '../../../../../shared/domain/errors/conflict.error';

export class BarberUnavailableError extends ConflictError {
  constructor() {
    super('This barber is unavailable at the selected time.');
  }
}
