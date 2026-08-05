import { DomainError } from './domain.error';

export class UserNotFoundError extends DomainError {
  constructor() {
    super('Usuário não encontrado.');
  }
}
