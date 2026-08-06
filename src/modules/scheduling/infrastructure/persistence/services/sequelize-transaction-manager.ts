import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

import { TransactionManager } from '../../../core/application/ports/transaction-manager.port';
import { TransactionContext } from '../../../../../shared/database/transaction-context';

@Injectable()
export class SequelizeTransactionManager implements TransactionManager {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  /**
   * Commits on success and rolls back on any rejection, `work`'s
   * thrown error included — Sequelize's own `transaction()` handles
   * that, so domain errors raised inside `work` (e.g.
   * `BarberTimeSlotConflictError`) reach the caller unchanged.
   */
  runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return TransactionContext.runAtomic(this.sequelize, () => work());
  }
}
