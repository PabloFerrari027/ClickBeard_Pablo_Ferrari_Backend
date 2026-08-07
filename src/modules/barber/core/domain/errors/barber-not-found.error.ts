import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';

export class BarberNotFoundError extends NotFoundError {
  constructor() {
    super('Barber not found.');
  }
}
