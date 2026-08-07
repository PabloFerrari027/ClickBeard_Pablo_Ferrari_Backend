import { DomainError } from './domain.error';

/** The caller is authenticated but not allowed to perform this action. Mapped to HTTP 403 by `DomainErrorFilter`. */
export abstract class ForbiddenError extends DomainError {}
