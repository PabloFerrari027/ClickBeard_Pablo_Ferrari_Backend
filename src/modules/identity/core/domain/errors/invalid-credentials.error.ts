import { DomainError } from './domain.error';

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('E-mail ou senha inválidos.');
  }
}
