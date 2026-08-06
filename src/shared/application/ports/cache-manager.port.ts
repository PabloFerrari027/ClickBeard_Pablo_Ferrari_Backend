import { CacheKey } from '../cache/cache-key';
import { CacheKeyPrefix } from '../cache/cache-key-prefix';
import { CacheOptions } from '../cache/cache-options';

export const CACHE_MANAGER = Symbol('CacheManager');

/**
 * The only port that actually talks to a cache technology (Redis, an
 * in-memory store, ...). Everything else in the cache module — key
 * generation, TTL policy, the Cached/CacheInvalidating decorators —
 * depends only on this abstraction, so swapping the underlying
 * technology never touches the application layer.
 */
export interface CacheManager {
  get<T>(key: CacheKey): Promise<T | null>;
  set<T>(key: CacheKey, value: T, options: CacheOptions): Promise<void>;
  delete(key: CacheKey): Promise<void>;
  /** Removes every entry whose key starts with the given prefix. */
  deleteByPrefix(prefix: CacheKeyPrefix): Promise<void>;
}
