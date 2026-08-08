import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { UserAlreadyExistsError } from '../../../core/domain/errors/user-already-exists.error';
import { User } from '../../../core/domain/entities/user.entity';
import {
  PaginatedUsers,
  UserRepository,
} from '../../../core/application/ports/user-repository.port';
import { mapToPersistenceError } from '../../../../../shared/database/map-to-persistence-error';
import { isUniqueConstraintError } from '../../../../../shared/database/sequelize-error.helpers';
import { TransactionContext } from '../../../../../shared/database/transaction-context';
import { toUserDomain, toUserPersistence } from '../mappers/user.mapper';
import { UserModel } from '../models/user.model';

@Injectable()
export class SequelizeUserRepository implements UserRepository {
  constructor(
    @InjectModel(UserModel) private readonly userModel: typeof UserModel,
  ) {}

  async save(user: User): Promise<void> {
    try {
      await this.userModel.upsert(toUserPersistence(user), {
        transaction: TransactionContext.current(),
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new UserAlreadyExistsError(user.getEmail().getValue());
      }

      throw mapToPersistenceError(error);
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const model = await this.userModel.findByPk(id, {
        transaction: TransactionContext.current(),
      });

      return model ? toUserDomain(model) : null;
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const model = await this.userModel.findOne({
        where: { email },
        transaction: TransactionContext.current(),
      });

      return model ? toUserDomain(model) : null;
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }

  async findAll(page: number, limit: number): Promise<PaginatedUsers> {
    try {
      const { rows, count } = await this.userModel.findAndCountAll({
        order: [['name', 'ASC']],
        limit,
        offset: (page - 1) * limit,
        transaction: TransactionContext.current(),
      });

      return { users: rows.map(toUserDomain), total: count };
    } catch (error) {
      throw mapToPersistenceError(error);
    }
  }
}
