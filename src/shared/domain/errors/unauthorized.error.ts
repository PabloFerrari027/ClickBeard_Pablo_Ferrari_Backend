import { DomainError } from './domain.error';

/** The caller's credentials/token are missing, invalid, or expired. Mapped to HTTP 401 by `DomainErrorFilter`. */
export abstract class UnauthorizedError extends DomainError {}
