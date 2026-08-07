import { Module } from '@nestjs/common';

import { QueueConfig } from './queue.config';
import { RedisConfig } from './redis.config';

/**
 * Isolated so `BullModule.forRootAsync` (and any other dynamic module)
 * can pull `RedisConfig`/`QueueConfig` into its own factory via its
 * `imports` option, the same reasoning `PgConfigModule` documents for
 * `SequelizeModule.forRootAsync`.
 */
@Module({
  providers: [RedisConfig, QueueConfig],
  exports: [RedisConfig, QueueConfig],
})
export class RedisConfigModule {}
