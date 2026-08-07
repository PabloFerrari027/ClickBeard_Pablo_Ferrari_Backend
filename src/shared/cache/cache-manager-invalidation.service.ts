import { Inject, Injectable } from '@nestjs/common';

import { CacheKey } from '../application/cache/cache-key';
import { CacheKeyPrefix } from '../application/cache/cache-key-prefix';
import { CACHE_MANAGER } from '../application/ports/cache-manager.port';
import { CacheInvalidationService } from '../application/ports/cache-invalidation-service.port';

import type { CacheManager } from '../application/ports/cache-manager.port';

/**
 * Delegates every invalidation to `CacheManager` rather than talking to
 * Redis directly, so the write side stays correct against whichever
 * `CacheManager` is wired (including its own fail-open behavior on a
 * cache outage) without duplicating that logic here.
 */
@Injectable()
export class CacheManagerInvalidationService implements CacheInvalidationService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: CacheManager,
  ) {}

  async invalidateKeys(keys: CacheKey[]): Promise<void> {
    await Promise.all(keys.map((key) => this.cacheManager.delete(key)));
  }

  async invalidatePrefixes(prefixes: CacheKeyPrefix[]): Promise<void> {
    await Promise.all(
      prefixes.map((prefix) => this.cacheManager.deleteByPrefix(prefix)),
    );
  }
}
