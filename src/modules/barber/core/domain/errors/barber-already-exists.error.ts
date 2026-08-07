import { ConflictError } from '../../../../../shared/domain/errors/conflict.error';

export class BarberAlreadyExistsError extends ConflictError {
  constructor() {
    super('A barber profile already exists for this user.');
  }
}
