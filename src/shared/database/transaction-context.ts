import { AsyncLocalStorage } from 'node:async_hooks';
import { Transaction } from 'sequelize';

/**
 * Makes the transaction started by a `TransactionManager` adapter
 * ambiently available to every repository call made further down the
 * same async call stack, without threading a `Transaction` parameter
 * through use case ports (`TransactionManager.runInTransaction`'s
 * `work` callback takes no argument by design). Repositories call
 * `TransactionContext.current()` and pass the result as Sequelize's
 * `transaction` option — `undefined` outside of any transaction, which
 * Sequelize treats as "run without one".
 */
export class TransactionContext {
  private static readonly storage = new AsyncLocalStorage<Transaction>();

  static run<T>(transaction: Transaction, work: () => Promise<T>): Promise<T> {
    return this.storage.run(transaction, work);
  }

  static current(): Transaction | undefined {
    return this.storage.getStore();
  }
}
