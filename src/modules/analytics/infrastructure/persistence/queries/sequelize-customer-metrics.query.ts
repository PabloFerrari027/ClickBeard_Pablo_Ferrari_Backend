import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import {
  CustomerAppointmentCount,
  CustomerLastAppointment,
  CustomerMetricsQuery,
} from '../../../core/application/ports/customer-metrics-query.port';
import { DateRange } from '../../../core/domain/value-objects/date-range.value-object';
import { mapToPersistenceError } from '../../../../../shared/database/map-to-persistence-error';
import { TransactionContext } from '../../../../../shared/database/transaction-context';

/**
 * Reads Identity's and Scheduling's tables by their literal names — the
 * same cross-module read pattern `SequelizeBarberDirectoryService`
 * uses. "Active" here always means `status = 'SCHEDULED'` in the range,
 * matching how the rest of the Analytics infra defines "used".
 */
@Injectable()
export class SequelizeCustomerMetricsQuery implements CustomerMetricsQuery {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  async topCustomersByAppointments(
    range: DateRange,
    limit: number,
  ): Promise<CustomerAppointmentCount[]> {
    try {
      return await this.sequelize.query<CustomerAppointmentCount>(
        `SELECT u.id AS "customerId", u.name AS "customerName", COUNT(a.id)::int AS "total"
         FROM "users" u
         INNER JOIN "appointments" a
           ON a.customer_id = u.id
          AND a.status = 'SCHEDULED'
          AND a.start_at BETWEEN :start AND :end
         WHERE u.role = 'CLIENT'
         GROUP BY u.id, u.name
         ORDER BY "total" DESC
         LIMIT :limit`,
        {
          replacements: {
            start: range.getStart(),
            end: range.getEnd(),
            limit,
          },
          type: QueryTypes.SELECT,
          transaction: TransactionContext.current(),
        },
      );
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async countActiveCustomers(range: DateRange): Promise<number> {
    return this.count(
      `SELECT COUNT(DISTINCT u.id)::int AS total
       FROM "users" u
       INNER JOIN "appointments" a
         ON a.customer_id = u.id
        AND a.status = 'SCHEDULED'
        AND a.start_at BETWEEN :start AND :end
       WHERE u.role = 'CLIENT'`,
      { start: range.getStart(), end: range.getEnd() },
    );
  }

  async countInactiveCustomers(range: DateRange): Promise<number> {
    return this.count(
      `SELECT COUNT(*)::int AS total
       FROM "users" u
       WHERE u.role = 'CLIENT'
         AND NOT EXISTS (
           SELECT 1 FROM "appointments" a
           WHERE a.customer_id = u.id
             AND a.status = 'SCHEDULED'
             AND a.start_at BETWEEN :start AND :end
         )`,
      { start: range.getStart(), end: range.getEnd() },
    );
  }

  async findLastAppointmentByCustomer(
    customerId: string,
  ): Promise<CustomerLastAppointment | null> {
    try {
      const rows = await this.sequelize.query<CustomerLastAppointment>(
        `SELECT u.id AS "customerId", u.name AS "customerName", MAX(a.start_at) AS "lastAppointmentAt"
         FROM "users" u
         LEFT JOIN "appointments" a
           ON a.customer_id = u.id AND a.status = 'SCHEDULED'
         WHERE u.id = :customerId
         GROUP BY u.id, u.name`,
        {
          replacements: { customerId },
          type: QueryTypes.SELECT,
          transaction: TransactionContext.current(),
        },
      );

      return rows[0] ?? null;
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  private async count(
    sql: string,
    replacements: Record<string, unknown>,
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
