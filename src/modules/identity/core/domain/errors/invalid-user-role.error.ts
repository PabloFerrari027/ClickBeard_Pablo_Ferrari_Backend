import { DomainError } from './domain.error';

export class InvalidUserRoleError extends DomainError {
  constructor(role: string) {
    super(`O perfil "${role}" não é válido.`);
  }
}
