import { DomainError } from './domain.error';

/** The referenced resource does not exist. Mapped to HTTP 404 by `DomainErrorFilter`. */
export abstract class NotFoundError extends DomainError {}
