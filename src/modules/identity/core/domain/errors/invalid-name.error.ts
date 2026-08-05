import { DomainError } from './domain.error';

export class InvalidNameError extends DomainError {
  constructor() {
    super('O nome deve ter pelo menos 2 caracteres.');
  }
}
