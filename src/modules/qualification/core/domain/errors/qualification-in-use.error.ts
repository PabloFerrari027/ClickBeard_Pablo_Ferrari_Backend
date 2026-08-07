import { ConflictError } from '../../../../../shared/domain/errors/conflict.error';

export class QualificationInUseError extends ConflictError {
  constructor() {
    super(
      'This qualification is assigned to at least one barber and cannot be deleted.',
    );
  }
}
