import { Inject, Injectable, Logger } from '@nestjs/common';
import type Redis from 'ioredis';

import { REDIS_CLIENT } from './redis-client.token';
import { CacheKey } from '../application/cache/cache-key';
import { CacheKeyPrefix } from '../application/cache/cache-key-prefix';
import { CacheOptions } from '../application/cache/cache-options';
import { CacheManager } from '../application/ports/cache-manager.port';

const SCAN_BATCH_SIZE = 100;

/**
 * A cache is a performance optimization, never a source of truth, so a
 * Redis outage degrades every method to a safe no-op (miss on `get`,
 * silently dropped write on `set`/`delete`/`deleteByPrefix`) instead of
 * throwing. `CachedUseCase`/`CacheInvalidatingUseCase` do not catch
 * errors from this port, so failing closed here would turn "cache is
 * down" into "the whole read/write path is down" — the one failure mode
 * a cache must never cause.
 */
@Injectable()
export class RedisCacheManager implements CacheManager {
  private readonly logger = new Logger(RedisCacheManager.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get<T>(key: CacheKey): Promise<T | null> {
    try {
      const raw = await this.redis.get(key.toString());

      return raw === null ? null : (JSON.parse(raw) as T);
    } catch (error) {
      this.logCacheFailure('get', error);

      return null;
    }
  }

  async set<T>(key: CacheKey, value: T, options: CacheOptions): Promise<void> {
    try {
      await this.redis.set(
        key.toString(),
        JSON.stringify(value),
        'EX',
        options.ttlSeconds,
      );
    } catch (error) {
      this.logCacheFailure('set', error);
    }
  }

  async delete(key: CacheKey): Promise<void> {
    try {
      await this.redis.del(key.toString());
    } catch (error) {
      this.logCacheFailure('delete', error);
    }
  }

  async deleteByPrefix(prefix: CacheKeyPrefix): Promise<void> {
    try {
      const keys = await this.scanKeys(`${prefix.toString()}*`);

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      this.logCacheFailure('deleteByPrefix', error);
    }
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, batch] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        SCAN_BATCH_SIZE,
      );

      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== '0');

    return keys;
  }

  private logCacheFailure(operation: string, error: unknown): void {
    this.logger.warn(
      `Redis cache ${operation} failed, degrading to a no-op: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
