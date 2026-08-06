/**
 * Base for infra-level persistence failures that carry no business
 * meaning (connection loss, timeouts, deadlocks, anything unexpected).
 * Adapters catch the underlying Sequelize/pg error and rethrow one of
 * these instead, so no infrastructure detail (SQL, driver error shape)
 * ever crosses into the application layer.
 */
export abstract class PersistenceError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = new.target.name;
  }
}
