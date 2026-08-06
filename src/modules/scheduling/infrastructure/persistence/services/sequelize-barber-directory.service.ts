import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import {
  BarberDirectory,
  BarberSnapshot,
} from '../../../core/application/ports/barber-directory.port';
import { mapToPersistenceError } from '../../../../../shared/database/map-to-persistence-error';
import { TransactionContext } from '../../../../../shared/database/transaction-context';

interface BarberSnapshotRow {
  id: string;
  active: boolean;
  qualificationIds: string[];
}

/**
 * Reads Barber and Identity's tables by their literal names instead of
 * importing those modules' Sequelize models — Scheduling only ever sees
 * the read-only `BarberSnapshot` shape the port defines, never Barber's
 * or Identity's own persistence details, keeping the same bounded
 * context isolation the application layer already has (see the port's
 * doc comment) at the infrastructure layer too.
 */
@Injectable()
export class SequelizeBarberDirectoryService implements BarberDirectory {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  async findById(barberId: string): Promise<BarberSnapshot | null> {
    try {
      const rows = await this.sequelize.query<BarberSnapshotRow>(
        `SELECT
           b.id AS "id",
           u.active AS "active",
           COALESCE(
             array_agg(bq.qualification_id) FILTER (WHERE bq.qualification_id IS NOT NULL),
             '{}'
           ) AS "qualificationIds"
         FROM "barbers" b
         INNER JOIN "users" u ON u.id = b.id
         LEFT JOIN "barbers_qualifications" bq ON bq.barber_id = b.id
         WHERE b.id = :barberId
         GROUP BY b.id, u.active`,
        {
          replacements: { barberId },
          type: QueryTypes.SELECT,
          transaction: TransactionContext.current(),
        },
      );

      const row = rows[0];

      if (!row) {
        return null;
      }

      return {
        id: row.id,
        active: row.active,
        qualificationIds: row.qualificationIds,
      };
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }
}
