import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';

import { QualificationNotFoundError } from '../../../../qualification/core/domain/errors/qualification-not-found.error';
import { Barber } from '../../../core/domain/entities/barber.entity';
import { BarberAlreadyExistsError } from '../../../core/domain/errors/barber-already-exists.error';
import {
  BarberRepository,
  PaginatedBarbers,
} from '../../../core/application/ports/barber-repository.port';
import { mapToPersistenceError } from '../../../../../shared/database/map-to-persistence-error';
import {
  isForeignKeyConstraintError,
  isUniqueConstraintError,
} from '../../../../../shared/database/sequelize-error.helpers';
import { TransactionContext } from '../../../../../shared/database/transaction-context';
import { toBarberDomain, toBarberPersistence } from '../mappers/barber.mapper';
import { BarberQualificationModel } from '../models/barber-qualification.model';
import { BarberModel } from '../models/barber.model';

@Injectable()
export class SequelizeBarberRepository implements BarberRepository {
  constructor(
    @InjectModel(BarberModel) private readonly barberModel: typeof BarberModel,
    @InjectModel(BarberQualificationModel)
    private readonly barberQualificationModel: typeof BarberQualificationModel,
  ) {}

  async save(barber: Barber): Promise<void> {
    try {
      await TransactionContext.runAtomic(
        this.barberModel.sequelize!,
        async (transaction) => {
          await this.barberModel.upsert(toBarberPersistence(barber), {
            transaction,
          });
          await this.syncQualifications(barber, transaction);
        },
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new BarberAlreadyExistsError();
      }

      if (isForeignKeyConstraintError(error)) {
        throw new QualificationNotFoundError();
      }

      throw mapToPersistenceError(error);
    }
  }

  private async syncQualifications(
    barber: Barber,
    transaction: Transaction,
  ): Promise<void> {
    const desired = new Set(barber.getQualificationIds());
    const existingLinks = await this.barberQualificationModel.findAll({
      where: { barberId: barber.getId() },
      transaction,
    });
    const existing = new Set(existingLinks.map((link) => link.qualificationId));

    const toAdd = [...desired].filter((id) => !existing.has(id));
    const toRemove = [...existing].filter((id) => !desired.has(id));

    if (toRemove.length > 0) {
      await this.barberQualificationModel.destroy({
        where: { barberId: barber.getId(), qualificationId: toRemove },
        transaction,
      });
    }

    if (toAdd.length > 0) {
      await this.barberQualificationModel.bulkCreate(
        toAdd.map((qualificationId) => ({
          barberId: barber.getId(),
          qualificationId,
          createdAt: barber.getUpdatedAt(),
        })),
        { transaction },
      );
    }
  }

  async findById(id: string): Promise<Barber | null> {
    try {
      const transaction = TransactionContext.current();
      const model = await this.barberModel.findByPk(id, { transaction });

      if (!model) {
        return null;
      }

      const qualificationIds = await this.findQualificationIds(id, transaction);
      return toBarberDomain(model, qualificationIds);
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async findAll(page: number, limit: number): Promise<PaginatedBarbers> {
    try {
      const transaction = TransactionContext.current();
      const { rows, count } = await this.barberModel.findAndCountAll({
        where: { active: true },
        order: [['name', 'ASC']],
        limit,
        offset: (page - 1) * limit,
        transaction,
      });

      if (rows.length === 0) {
        return { barbers: [], total: count };
      }

      const links = await this.barberQualificationModel.findAll({
        where: { barberId: rows.map((row) => row.id) },
        transaction,
      });
      const qualificationIdsByBarberId = new Map<string, string[]>();

      for (const link of links) {
        const current = qualificationIdsByBarberId.get(link.barberId) ?? [];
        current.push(link.qualificationId);
        qualificationIdsByBarberId.set(link.barberId, current);
      }

      const barbers = rows.map((row) =>
        toBarberDomain(row, qualificationIdsByBarberId.get(row.id) ?? []),
      );

      return { barbers, total: count };
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async existsByQualificationId(qualificationId: string): Promise<boolean> {
    try {
      const count = await this.barberQualificationModel.count({
        where: { qualificationId },
        transaction: TransactionContext.current(),
      });

      return count > 0;
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  private async findQualificationIds(
    barberId: string,
    transaction: Transaction | undefined,
  ): Promise<string[]> {
    const links = await this.barberQualificationModel.findAll({
      where: { barberId },
      transaction,
    });

    return links.map((link) => link.qualificationId);
  }
}
