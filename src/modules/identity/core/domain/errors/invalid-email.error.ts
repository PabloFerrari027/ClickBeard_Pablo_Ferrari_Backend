import { DomainError } from './domain.error';

export class InvalidEmailError extends DomainError {
  constructor(email: string) {
    super(`O e-mail "${email}" é inválido.`);
  }
}
