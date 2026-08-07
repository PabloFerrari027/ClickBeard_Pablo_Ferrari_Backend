import { DomainError } from './domain.error';

/** The request conflicts with the resource's current state. Mapped to HTTP 409 by `DomainErrorFilter`. */
export abstract class ConflictError extends DomainError {}
