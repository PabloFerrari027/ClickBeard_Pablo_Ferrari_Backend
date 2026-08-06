import { PersistenceError } from './persistence.error';

export class DatabaseTimeoutError extends PersistenceError {
  constructor(cause?: unknown) {
    super('The database operation timed out.', cause);
  }
}
