import { Injectable } from '@nestjs/common';
import { QueueOptions } from 'bullmq';

import { RedisConfig } from './redis.config';

/**
 * Builds the BullMQ connection options consumed by `QueueModule`. Kept
 * separate from `RedisConfig` so the Redis connection values themselves
 * stay library-agnostic — only this class knows about BullMQ.
 */
@Injectable()
export class QueueConfig {
  constructor(private readonly redisConfig: RedisConfig) {}

  createQueueOptions(): QueueOptions {
    const { host, port, password, db } = this.redisConfig.getOptions();

    return {
      connection: {
        host,
        port,
        password,
        db,
        maxRetriesPerRequest: null,
      },
    };
  }
}
