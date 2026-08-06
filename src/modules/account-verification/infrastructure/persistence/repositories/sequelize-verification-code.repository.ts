import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { VerificationCode } from '../../../core/domain/entities/verification-code.entity';
import { VerificationCodeRepository } from '../../../core/application/ports/verification-code-repository.port';
import { mapToPersistenceError } from '../../../../../shared/database/map-to-persistence-error';
import { TransactionContext } from '../../../../../shared/database/transaction-context';
import {
  toVerificationCodeDomain,
  toVerificationCodePersistence,
} from '../mappers/verification-code.mapper';
import { VerificationCodeModel } from '../models/verification-code.model';

@Injectable()
export class SequelizeVerificationCodeRepository implements VerificationCodeRepository {
  constructor(
    @InjectModel(VerificationCodeModel)
    private readonly verificationCodeModel: typeof VerificationCodeModel,
  ) {}

  async save(verificationCode: VerificationCode): Promise<void> {
    try {
      await this.verificationCodeModel.upsert(
        toVerificationCodePersistence(verificationCode),
        { transaction: TransactionContext.current() },
      );
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async findActiveByUserId(userId: string): Promise<VerificationCode | null> {
    try {
      const model = await this.verificationCodeModel.findOne({
        where: {
          userId,
          consumedAt: { [Op.is]: null },
          invalidatedAt: { [Op.is]: null },
          expiresAt: { [Op.gt]: new Date() },
        },
        order: [['createdAt', 'DESC']],
        transaction: TransactionContext.current(),
      });

      return model ? toVerificationCodeDomain(model) : null;
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async findLatestByUserId(userId: string): Promise<VerificationCode | null> {
    try {
      const model = await this.verificationCodeModel.findOne({
        where: { userId },
        order: [['createdAt', 'DESC']],
        transaction: TransactionContext.current(),
      });

      return model ? toVerificationCodeDomain(model) : null;
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async findExpiredActive(now: Date): Promise<VerificationCode[]> {
    try {
      const models = await this.verificationCodeModel.findAll({
        where: {
          consumedAt: { [Op.is]: null },
          invalidatedAt: { [Op.is]: null },
          expiresAt: { [Op.lt]: now },
        },
        transaction: TransactionContext.current(),
      });

      return models.map(toVerificationCodeDomain);
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }
}
