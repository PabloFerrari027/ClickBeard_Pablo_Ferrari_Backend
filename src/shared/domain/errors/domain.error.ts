/**
 * Base for every business-rule violation raised by a use case. Never
 * thrown directly — always through one of the category subclasses
 * below, which is what `DomainErrorFilter` (shared/filters) maps to an
 * HTTP status. Replaces the identical per-module `DomainError` base
 * that used to be duplicated in every module's `core/domain/errors/`.
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
