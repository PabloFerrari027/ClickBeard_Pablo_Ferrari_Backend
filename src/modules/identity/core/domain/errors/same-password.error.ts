import { DomainError } from './domain.error';

export class SamePasswordError extends DomainError {
  constructor() {
    super('A nova senha deve ser diferente da senha atual.');
  }
}
