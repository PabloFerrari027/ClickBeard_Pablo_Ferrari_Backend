import { DomainError } from './domain.error';

/** Invalid input or a business-rule precondition wasn't met. Mapped to HTTP 400 by `DomainErrorFilter`. */
export abstract class ValidationError extends DomainError {}
