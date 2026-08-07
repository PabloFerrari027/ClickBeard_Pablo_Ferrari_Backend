import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import {
  UserMetricsQuery,
  UserRoleCount,
} from '../../../core/application/ports/user-metrics-query.port';
import { DateRange } from '../../../core/domain/value-objects/date-range.value-object';
import { mapToPersistenceError } from '../../../../../shared/database/map-to-persistence-error';
import { TransactionContext } from '../../../../../shared/database/transaction-context';

/**
 * Reads Identity's and Account Verification's tables by their literal
 * names, the same cross-module read pattern
 * `SequelizeBarberDirectoryService` uses — Analytics never imports
 * those modules' Sequelize models, only sees the aggregate shapes these
 * ports define.
 */
@Injectable()
export class SequelizeUserMetricsQuery implements UserMetricsQuery {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  async countTotal(): Promise<number> {
    return this.count('SELECT COUNT(*)::int AS total FROM "users"');
  }

  async countByRole(): Promise<UserRoleCount[]> {
    try {
      return await this.sequelize.query<UserRoleCount>(
        `SELECT role AS "role", COUNT(*)::int AS "total"
         FROM "users"
         GROUP BY role`,
        { type: QueryTypes.SELECT, transaction: TransactionContext.current() },
      );
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async countActive(): Promise<number> {
    return this.count(
      'SELECT COUNT(*)::int AS total FROM "users" WHERE active = true',
    );
  }

  async countInactive(): Promise<number> {
    return this.count(
      'SELECT COUNT(*)::int AS total FROM "users" WHERE active = false',
    );
  }

  async countRegisteredInRange(range: DateRange): Promise<number> {
    return this.count(
      `SELECT COUNT(*)::int AS total
       FROM "users"
       WHERE created_at BETWEEN :start AND :end`,
      { start: range.getStart(), end: range.getEnd() },
    );
  }

  /** A user is verified once any of their verification codes has been consumed. */
  async countVerified(): Promise<number> {
    return this.count(
      `SELECT COUNT(DISTINCT user_id)::int AS total
       FROM "verification_codes"
       WHERE consumed_at IS NOT NULL`,
    );
  }

  async countPendingVerification(): Promise<number> {
    return this.count(
      `SELECT COUNT(*)::int AS total
       FROM "users" u
       WHERE NOT EXISTS (
         SELECT 1 FROM "verification_codes" vc
         WHERE vc.user_id = u.id AND vc.consumed_at IS NOT NULL
       )`,
    );
  }

  private async count(
    sql: string,
    replacements?: Record<string, unknown>,
  ): Promise<number> {
    try {
      const rows = await this.sequelize.query<{ total: number }>(sql, {
        replacements,
        type: QueryTypes.SELECT,
        transaction: TransactionContext.current(),
      });

      return rows[0]?.total ?? 0;
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }
}
