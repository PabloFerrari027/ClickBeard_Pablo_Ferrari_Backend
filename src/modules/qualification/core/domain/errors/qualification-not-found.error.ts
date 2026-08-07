import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';

export class QualificationNotFoundError extends NotFoundError {
  constructor() {
    super('Qualification not found.');
  }
}
