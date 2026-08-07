import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { BarberUnavailability } from '../../../core/domain/entities/barber-unavailability.entity';
import { BarberUnavailabilityRepository } from '../../../core/application/ports/barber-unavailability-repository.port';
import { mapToPersistenceError } from '../../../../../shared/database/map-to-persistence-error';
import { TransactionContext } from '../../../../../shared/database/transaction-context';
import {
  toBarberUnavailabilityDomain,
  toBarberUnavailabilityPersistence,
} from '../mappers/barber-unavailability.mapper';
import { BarberUnavailabilityModel } from '../models/barber-unavailability.model';

@Injectable()
export class SequelizeBarberUnavailabilityRepository implements BarberUnavailabilityRepository {
  constructor(
    @InjectModel(BarberUnavailabilityModel)
    private readonly unavailabilityModel: typeof BarberUnavailabilityModel,
  ) {}

  async save(unavailability: BarberUnavailability): Promise<void> {
    try {
      await this.unavailabilityModel.upsert(
        toBarberUnavailabilityPersistence(unavailability),
        { transaction: TransactionContext.current() },
      );
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async findById(id: string): Promise<BarberUnavailability | null> {
    try {
      const model = await this.unavailabilityModel.findByPk(id, {
        transaction: TransactionContext.current(),
      });

      return model ? toBarberUnavailabilityDomain(model) : null;
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async listByBarberId(barberId: string): Promise<BarberUnavailability[]> {
    try {
      const models = await this.unavailabilityModel.findAll({
        where: { barberId },
        order: [['startAt', 'ASC']],
        transaction: TransactionContext.current(),
      });

      return models.map(toBarberUnavailabilityDomain);
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async existsOverlapping(
    barberId: string,
    startAt: Date,
    endAt: Date,
  ): Promise<boolean> {
    try {
      const count = await this.unavailabilityModel.count({
        where: {
          barberId,
          startAt: { [Op.lt]: endAt },
          endAt: { [Op.gt]: startAt },
        },
        transaction: TransactionContext.current(),
      });

      return count > 0;
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.unavailabilityModel.destroy({
        where: { id },
        transaction: TransactionContext.current(),
      });
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }
}
