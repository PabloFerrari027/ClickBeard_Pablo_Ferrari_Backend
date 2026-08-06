import { CacheKey } from '../cache/cache-key';
import { CacheKeyPrefix } from '../cache/cache-key-prefix';

export const CACHE_INVALIDATION_SERVICE = Symbol('CacheInvalidationService');

/**
 * The write side's dedicated entry point for cache consistency. Kept
 * separate from CacheManager (a lower-level get/set/delete contract) so
 * invalidation can evolve independently — e.g. batching, logging, or
 * fanning out to multiple cache nodes — without changing how reads are
 * cached.
 */
export interface CacheInvalidationService {
  invalidateKeys(keys: CacheKey[]): Promise<void>;
  invalidatePrefixes(prefixes: CacheKeyPrefix[]): Promise<void>;
}
