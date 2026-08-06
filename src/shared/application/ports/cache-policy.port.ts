import { CacheResource } from '../cache/cache-resource.enum';

export const CACHE_POLICY = Symbol('CachePolicy');

/**
 * Resolves how long a resource may stay cached. Kept separate from
 * CacheManager so TTL rules can change (or come from remote config) for
 * any resource without touching the use cases that cache it or the
 * technology that stores it.
 */
export interface CachePolicy {
  resolveTtlSeconds(resource: CacheResource): number;
}
