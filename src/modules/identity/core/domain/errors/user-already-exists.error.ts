import { DomainError } from './domain.error';

export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`A user with the email "${email}" already exists.`);
  }
}
