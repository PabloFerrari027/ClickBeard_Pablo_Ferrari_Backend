import { ValidationError } from '../../../../../shared/domain/errors/validation.error';

export class QualificationNotAssignedError extends ValidationError {
  constructor() {
    super('This qualification is not assigned to the barber.');
  }
}
