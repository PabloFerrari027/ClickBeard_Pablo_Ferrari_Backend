import { PersistenceError } from './persistence.error';

/** A deadlock or similar conflict with another concurrent transaction; safe to retry. */
export class DatabaseConflictError extends PersistenceError {
  constructor(cause?: unknown) {
    super(
      'The database operation could not complete due to a conflicting concurrent transaction.',
      cause,
    );
  }
}
