import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

import { CacheManagerInvalidationService } from './cache-manager-invalidation.service';
import { REDIS_CLIENT } from './redis-client.token';
import { RedisCacheManager } from './redis-cache-manager';
import { StaticCachePolicy } from './static-cache-policy';
import { RedisConfigModule } from '../config/redis-config.module';
import { RedisConfig } from '../config/redis.config';
import { CACHE_INVALIDATION_SERVICE } from '../application/ports/cache-invalidation-service.port';
import { CACHE_MANAGER } from '../application/ports/cache-manager.port';
import { CACHE_POLICY } from '../application/ports/cache-policy.port';

/**
 * Single entry point AppModule imports for caching. Global, mirroring
 * `DatabaseModule`, so `CACHE_MANAGER`/`CACHE_POLICY`/
 * `CACHE_INVALIDATION_SERVICE` resolve for every domain module without
 * each one importing this module itself. `REDIS_CLIENT` is exported too
 * so infra outside this module (e.g. Analytics' Redis-backed counter
 * store) can share the same connection instead of opening another.
 */
@Global()
@Module({
  imports: [RedisConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (redisConfig: RedisConfig) => {
        const { host, port, password, db } = redisConfig.getOptions();

        return new Redis({ host, port, password, db, lazyConnect: false });
      },
      inject: [RedisConfig],
    },
    { provide: CACHE_MANAGER, useClass: RedisCacheManager },
    { provide: CACHE_POLICY, useClass: StaticCachePolicy },
    {
      provide: CACHE_INVALIDATION_SERVICE,
      useClass: CacheManagerInvalidationService,
    },
  ],
  exports: [
    REDIS_CLIENT,
    CACHE_MANAGER,
    CACHE_POLICY,
    CACHE_INVALIDATION_SERVICE,
  ],
})
export class RedisCacheModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
