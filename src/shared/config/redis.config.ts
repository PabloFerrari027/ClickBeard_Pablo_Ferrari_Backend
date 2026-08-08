import { Injectable } from '@nestjs/common';

import { EnvConfig } from './env.config';

export interface RedisConnectionOptions {
  host: string;
  port: number;
  password?: string;
  db: number;
}

/** Framework/library-agnostic Redis connection options, resolved from `EnvConfig`. */
@Injectable()
export class RedisConfig {
  constructor(private readonly envConfig: EnvConfig) {}

  getOptions(): RedisConnectionOptions {
    return {
      host: this.envConfig.redisHost,
      port: this.envConfig.redisPort,
      password: this.envConfig.redisPassword,
      db: this.envConfig.redisDb,
    };
  }
}
