import { DomainError } from './domain.error';

export class SameUserRoleError extends DomainError {
  constructor() {
    super('O novo perfil deve ser diferente do perfil atual.');
  }
}
