import {
  ConnectionError,
  DatabaseError,
  ForeignKeyConstraintError,
  TimeoutError,
  UniqueConstraintError,
} from 'sequelize';

/** Postgres error code for a deadlock detected by the server. */
const POSTGRES_DEADLOCK_CODE = '40P01';

export function isUniqueConstraintError(
  error: unknown,
  indexName?: string,
): error is UniqueConstraintError {
  if (!(error instanceof UniqueConstraintError)) {
    return false;
  }

  return indexName === undefined || error.parent?.['constraint'] === indexName;
}

export function isForeignKeyConstraintError(
  error: unknown,
): error is ForeignKeyConstraintError {
  return error instanceof ForeignKeyConstraintError;
}

export function isConnectionError(error: unknown): error is ConnectionError {
  return error instanceof ConnectionError;
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

export function isDeadlockError(error: unknown): error is DatabaseError {
  return (
    error instanceof DatabaseError &&
    (error.parent as { code?: string } | undefined)?.code ===
      POSTGRES_DEADLOCK_CODE
  );
}
