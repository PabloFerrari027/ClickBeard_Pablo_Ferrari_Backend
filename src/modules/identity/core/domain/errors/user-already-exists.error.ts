import { DomainError } from './domain.error';

export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`Já existe um usuário cadastrado com o e-mail "${email}".`);
  }
}
