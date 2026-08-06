import { DatabaseConflictError } from './errors/database-conflict.error';
import { DatabaseTimeoutError } from './errors/database-timeout.error';
import { DatabaseUnavailableError } from './errors/database-unavailable.error';
import { PersistenceError } from './errors/persistence.error';
import { UnexpectedPersistenceError } from './errors/unexpected-persistence.error';
import {
  isConnectionError,
  isDeadlockError,
  isTimeoutError,
} from './sequelize-error.helpers';

/**
 * Last-resort translation for repository catch blocks, once the caller
 * has already checked for the domain-specific conflicts it cares about
 * (unique/foreign key violations). Never rethrows the original Sequelize
 * error as-is, so no driver/SQL detail leaks past the adapter.
 */
export function mapToPersistenceError(error: unknown): PersistenceError {
  if (isConnectionError(error)) {
    return new DatabaseUnavailableError(error);
  }

  if (isTimeoutError(error)) {
    return new DatabaseTimeoutError(error);
  }

  if (isDeadlockError(error)) {
    return new DatabaseConflictError(error);
  }

  return new UnexpectedPersistenceError(error);
}
