import { Injectable, Logger } from '@nestjs/common';
import { SequelizeModuleOptions } from '@nestjs/sequelize';

import { EnvConfig } from './env.config';
import { PgConfig } from './pg.config';

const CONNECTION_RETRY_ATTEMPTS = 10;
const CONNECTION_RETRY_DELAY_MS = 3_000;

/**
 * Builds the Sequelize connection options consumed by `PgModule`. Kept
 * separate from `PgConfig` so the Postgres connection values themselves
 * stay ORM-agnostic — only this class knows about Sequelize.
 */
@Injectable()
export class SequelizeConfig {
  private readonly logger = new Logger(SequelizeConfig.name);

  constructor(
    private readonly envConfig: EnvConfig,
    private readonly pgConfig: PgConfig,
  ) {}

  createSequelizeOptions(): SequelizeModuleOptions {
    const { host, port, username, password, database, ssl, pool } =
      this.pgConfig.getOptions();

    return {
      dialect: 'postgres',
      host,
      port,
      username,
      password,
      database,
      pool,
      dialectOptions: ssl
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
      // Migrations own the schema; the app never creates or alters tables.
      synchronize: false,
      autoLoadModels: false,
      logging: this.buildLogger(),
      retryAttempts: CONNECTION_RETRY_ATTEMPTS,
      retryDelay: CONNECTION_RETRY_DELAY_MS,
    };
  }

  private buildLogger(): SequelizeModuleOptions['logging'] {
    if (this.envConfig.nodeEnv === 'development') {
      return (sql: string) => this.logger.debug(sql);
    }

    return false;
  }
}
