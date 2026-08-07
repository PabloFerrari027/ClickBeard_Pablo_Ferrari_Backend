import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import {
  AppointmentMetricsQuery,
  DayOfWeekUsage,
  TimeSlotUsage,
} from '../../../core/application/ports/appointment-metrics-query.port';
import { DateRange } from '../../../core/domain/value-objects/date-range.value-object';
import { mapToPersistenceError } from '../../../../../shared/database/map-to-persistence-error';
import { TransactionContext } from '../../../../../shared/database/transaction-context';

/**
 * "Used"/"booked" here always means `status = 'SCHEDULED'` — the same
 * convention `SequelizeAvailabilityService.getBookedSlots` uses in
 * Scheduling, so a mass-cancelled slot never reads as busy.
 */
@Injectable()
export class SequelizeAppointmentMetricsQuery implements AppointmentMetricsQuery {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  async countTotal(): Promise<number> {
    return this.count('SELECT COUNT(*)::int AS total FROM "appointments"');
  }

  async countInRange(range: DateRange): Promise<number> {
    return this.count(
      `SELECT COUNT(*)::int AS total
       FROM "appointments"
       WHERE start_at BETWEEN :start AND :end`,
      { start: range.getStart(), end: range.getEnd() },
    );
  }

  async countUpcoming(from: Date): Promise<number> {
    return this.count(
      `SELECT COUNT(*)::int AS total
       FROM "appointments"
       WHERE status = 'SCHEDULED' AND start_at >= :from`,
      { from },
    );
  }

  async countCancelled(range?: DateRange): Promise<number> {
    return this.count(
      `SELECT COUNT(*)::int AS total
       FROM "appointments"
       WHERE status = 'CANCELLED' ${this.rangeClause(range, 'start_at')}`,
      this.rangeReplacements(range),
    );
  }

  async cancellationRate(range?: DateRange): Promise<number> {
    try {
      const rows = await this.sequelize.query<{
        total: number;
        cancelled: number;
      }>(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled
         FROM "appointments"
         ${this.rangeClause(range, 'start_at', true)}`,
        {
          replacements: this.rangeReplacements(range),
          type: QueryTypes.SELECT,
          transaction: TransactionContext.current(),
        },
      );

      const { total, cancelled } = rows[0] ?? { total: 0, cancelled: 0 };

      return total === 0 ? 0 : cancelled / total;
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async mostUsedTimeSlots(
    range: DateRange,
    limit: number,
  ): Promise<TimeSlotUsage[]> {
    try {
      return await this.sequelize.query<TimeSlotUsage>(
        `SELECT to_char(start_at, 'HH24:MI') AS "startTime", COUNT(*)::int AS "total"
         FROM "appointments"
         WHERE status = 'SCHEDULED' AND start_at BETWEEN :start AND :end
         GROUP BY "startTime"
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

  async busiestDaysOfWeek(
    range: DateRange,
    limit: number,
  ): Promise<DayOfWeekUsage[]> {
    try {
      return await this.sequelize.query<DayOfWeekUsage>(
        `SELECT EXTRACT(DOW FROM start_at)::int AS "dayOfWeek", COUNT(*)::int AS "total"
         FROM "appointments"
         WHERE status = 'SCHEDULED' AND start_at BETWEEN :start AND :end
         GROUP BY "dayOfWeek"
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

  private rangeClause(
    range: DateRange | undefined,
    column: string,
    asWhere = false,
  ): string {
    if (!range) {
      return '';
    }

    return `${asWhere ? 'WHERE' : 'AND'} ${column} BETWEEN :start AND :end`;
  }

  private rangeReplacements(range?: DateRange): Record<string, unknown> {
    return range ? { start: range.getStart(), end: range.getEnd() } : {};
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
