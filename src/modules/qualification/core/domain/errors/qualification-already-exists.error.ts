import { DomainError } from './domain.error';

export class QualificationAlreadyExistsError extends DomainError {
  constructor(name: string) {
    super(`A qualification with the name "${name}" already exists.`);
  }
}
