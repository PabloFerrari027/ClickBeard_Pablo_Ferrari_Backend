import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

/**
 * Fails loudly and early if Postgres is unreachable at boot, instead of
 * only surfacing a connection error on the first query. `@nestjs/sequelize`
 * already retries the initial connection (see `SequelizeConfig`); this
 * just turns that outcome into a clear log line either way.
 */
@Injectable()
export class PgConnectionChecker implements OnModuleInit {
  private readonly logger = new Logger(PgConnectionChecker.name);

  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.sequelize.authenticate();
      this.logger.log('Postgres connection established.');
    } catch (error) {
      this.logger.error(
        'Failed to establish the Postgres connection.',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
