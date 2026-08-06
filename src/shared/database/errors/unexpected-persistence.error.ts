import { PersistenceError } from './persistence.error';

export class UnexpectedPersistenceError extends PersistenceError {
  constructor(cause?: unknown) {
    super('An unexpected persistence error occurred.', cause);
  }
}
