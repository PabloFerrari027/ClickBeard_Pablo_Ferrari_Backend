import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';

import { Qualification } from '../../../core/domain/entities/qualification.entity';
import { QualificationAlreadyExistsError } from '../../../core/domain/errors/qualification-already-exists.error';
import { QualificationInUseError } from '../../../core/domain/errors/qualification-in-use.error';
import { QualificationRepository } from '../../../core/application/ports/qualification-repository.port';
import { mapToPersistenceError } from '../../../../../shared/database/map-to-persistence-error';
import {
  isForeignKeyConstraintError,
  isUniqueConstraintError,
} from '../../../../../shared/database/sequelize-error.helpers';
import { TransactionContext } from '../../../../../shared/database/transaction-context';
import {
  toQualificationDomain,
  toQualificationPersistence,
} from '../mappers/qualification.mapper';
import { QualificationModel } from '../models/qualification.model';

@Injectable()
export class SequelizeQualificationRepository implements QualificationRepository {
  constructor(
    @InjectModel(QualificationModel)
    private readonly qualificationModel: typeof QualificationModel,
  ) {}

  async save(qualification: Qualification): Promise<void> {
    try {
      await this.qualificationModel.upsert(
        toQualificationPersistence(qualification),
        { transaction: TransactionContext.current() },
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new QualificationAlreadyExistsError(qualification.getName());
      }

      throw mapToPersistenceError(error);
    }
  }

  async findById(id: string): Promise<Qualification | null> {
    try {
      const model = await this.qualificationModel.findByPk(id, {
        transaction: TransactionContext.current(),
      });

      return model ? toQualificationDomain(model) : null;
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async findByName(name: string): Promise<Qualification | null> {
    try {
      const model = await this.qualificationModel.findOne({
        where: { name },
        transaction: TransactionContext.current(),
      });

      return model ? toQualificationDomain(model) : null;
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async findAll(): Promise<Qualification[]> {
    try {
      const models = await this.qualificationModel.findAll({
        order: [['name', 'ASC']],
        transaction: TransactionContext.current(),
      });

      return models.map(toQualificationDomain);
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  /**
   * Reads the `barbers_qualifications` join table by its literal name
   * instead of importing Barber's model — Barber and Qualification are
   * separate bounded contexts (see README), and this keeps that
   * boundary intact at the infrastructure layer too, not just the
   * application layer.
   */
  async listByBarberId(barberId: string): Promise<Qualification[]> {
    try {
      const models = await this.qualificationModel.sequelize!.query(
        `SELECT q.* FROM "qualifications" q
         INNER JOIN "barbers_qualifications" bq ON bq.qualification_id = q.id
         WHERE bq.barber_id = :barberId
         ORDER BY q.name ASC`,
        {
          replacements: { barberId },
          type: QueryTypes.SELECT,
          mapToModel: true,
          model: this.qualificationModel,
          transaction: TransactionContext.current(),
        },
      );

      return models.map(toQualificationDomain);
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.qualificationModel.destroy({
        where: { id },
        transaction: TransactionContext.current(),
      });
    } catch (error) {
      if (isForeignKeyConstraintError(error)) {
        throw new QualificationInUseError();
      }

      throw mapToPersistenceError(error);
    }
  }
}
