import { DomainError } from './domain.error';

export class InvalidUserRoleError extends DomainError {
  constructor(role: string) {
    super(`The role "${role}" is not valid.`);
  }
}
