import { Injectable } from '@nestjs/common';

import { EnvConfig } from './env.config';

export interface PgPoolOptions {
  max: number;
  min: number;
  idle: number;
  acquire: number;
}

export interface PgConnectionOptions {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  pool: PgPoolOptions;
}

/** Framework/ORM-agnostic Postgres connection options, resolved from `EnvConfig`. */
@Injectable()
export class PgConfig {
  constructor(private readonly envConfig: EnvConfig) {}

  getOptions(): PgConnectionOptions {
    return {
      host: this.envConfig.dbHost,
      port: this.envConfig.dbPort,
      username: this.envConfig.dbUser,
      password: this.envConfig.dbPassword,
      database: this.envConfig.dbName,
      ssl: this.envConfig.dbSsl,
      pool: {
        max: this.envConfig.dbPoolMax,
        min: this.envConfig.dbPoolMin,
        idle: this.envConfig.dbPoolIdleMs,
        acquire: this.envConfig.dbPoolAcquireMs,
      },
    };
  }
}
