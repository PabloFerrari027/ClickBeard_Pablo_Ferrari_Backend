import { ConflictError } from '../../../../../shared/domain/errors/conflict.error';

export class QualificationAlreadyExistsError extends ConflictError {
  constructor(name: string) {
    super(`A qualification with the name "${name}" already exists.`);
  }
}
