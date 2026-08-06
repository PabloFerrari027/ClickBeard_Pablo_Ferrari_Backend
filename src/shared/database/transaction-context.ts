import { AsyncLocalStorage } from 'node:async_hooks';
import { Sequelize, Transaction } from 'sequelize';

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

  /**
   * For adapters whose own port method spans more than one statement
   * (e.g. `BarberRepository.save` upserting the barber row and syncing
   * its qualification links) and must run atomically even though
   * nothing above them called `TransactionManager.runInTransaction`.
   * Joins the ambient transaction if one is already running instead of
   * nesting a second one.
   */
  static async runAtomic<T>(
    sequelize: Sequelize,
    work: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    const existing = this.current();

    if (existing) {
      return work(existing);
    }

    return sequelize.transaction((transaction) =>
      this.run(transaction, () => work(transaction)),
    );
  }
}
