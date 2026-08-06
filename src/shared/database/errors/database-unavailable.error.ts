import { PersistenceError } from './persistence.error';

export class DatabaseUnavailableError extends PersistenceError {
  constructor(cause?: unknown) {
    super('The database is currently unavailable.', cause);
  }
}
