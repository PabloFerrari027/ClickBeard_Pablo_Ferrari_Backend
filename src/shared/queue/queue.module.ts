import { Global, Module } from '@nestjs/common';

import { BullMqMessageQueue } from './bullmq-message-queue';
import { QueueEventBus } from './queue-event-bus';
import { RedisConfigModule } from '../config/redis-config.module';
import { EVENT_BUS } from '../application/ports/event-bus.port';
import { MESSAGE_QUEUE } from '../application/ports/message-queue.port';

/**
 * Single entry point AppModule imports for async messaging. Global,
 * mirroring `DatabaseModule`/`RedisCacheModule`, so `EVENT_BUS`/
 * `MESSAGE_QUEUE` resolve for every domain module without each one
 * importing this module itself.
 */
@Global()
@Module({
  imports: [RedisConfigModule],
  providers: [
    { provide: MESSAGE_QUEUE, useClass: BullMqMessageQueue },
    { provide: EVENT_BUS, useClass: QueueEventBus },
  ],
  exports: [MESSAGE_QUEUE, EVENT_BUS],
})
export class QueueModule {}
