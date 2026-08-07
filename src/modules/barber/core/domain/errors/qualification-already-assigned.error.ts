import { ConflictError } from '../../../../../shared/domain/errors/conflict.error';

export class QualificationAlreadyAssignedError extends ConflictError {
  constructor() {
    super('This qualification is already assigned to the barber.');
  }
}
