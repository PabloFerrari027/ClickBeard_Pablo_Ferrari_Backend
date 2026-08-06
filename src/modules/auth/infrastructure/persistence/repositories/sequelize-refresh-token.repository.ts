import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { RefreshToken } from '../../../core/domain/entities/refresh-token.entity';
import { RefreshTokenRepository } from '../../../core/application/ports/refresh-token-repository.port';
import { mapToPersistenceError } from '../../../../../shared/database/map-to-persistence-error';
import { TransactionContext } from '../../../../../shared/database/transaction-context';
import {
  toRefreshTokenDomain,
  toRefreshTokenPersistence,
} from '../mappers/refresh-token.mapper';
import { RefreshTokenModel } from '../models/refresh-token.model';

@Injectable()
export class SequelizeRefreshTokenRepository implements RefreshTokenRepository {
  constructor(
    @InjectModel(RefreshTokenModel)
    private readonly refreshTokenModel: typeof RefreshTokenModel,
  ) {}

  async save(refreshToken: RefreshToken): Promise<void> {
    try {
      await this.refreshTokenModel.upsert(
        toRefreshTokenPersistence(refreshToken),
        { transaction: TransactionContext.current() },
      );
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    try {
      const model = await this.refreshTokenModel.findOne({
        where: { tokenHash },
        transaction: TransactionContext.current(),
      });

      return model ? toRefreshTokenDomain(model) : null;
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }
}
