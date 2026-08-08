import { Injectable } from '@nestjs/common';

import { CacheResource } from '../application/cache/cache-resource.enum';
import { CachePolicy } from '../application/ports/cache-policy.port';

const ONE_MINUTE = 60;
const ONE_HOUR = 60 * ONE_MINUTE;

/**
 * Fixed in code rather than sourced from `EnvConfig`: these TTLs are a
 * performance/consistency trade-off tuned per resource (how often it
 * changes, how expensive it is to recompute), not something that varies
 * by deployment environment the way connection settings do.
 */
const TTL_SECONDS_BY_RESOURCE: Record<CacheResource, number> = {
  [CacheResource.USER_PROFILE]: 5 * ONE_MINUTE,
  [CacheResource.USERS_LIST]: 5 * ONE_MINUTE,
  [CacheResource.BARBER]: 5 * ONE_MINUTE,
  [CacheResource.BARBERS_LIST]: 5 * ONE_MINUTE,
  [CacheResource.QUALIFICATIONS]: 15 * ONE_MINUTE,
  [CacheResource.APPOINTMENT]: ONE_MINUTE,
  [CacheResource.CUSTOMER_APPOINTMENTS]: ONE_MINUTE,
  [CacheResource.TODAY_APPOINTMENTS]: ONE_MINUTE,
  [CacheResource.FUTURE_APPOINTMENTS]: ONE_MINUTE,
  [CacheResource.AVAILABLE_TIME_SLOTS]: 30,
  [CacheResource.DASHBOARD_METRICS]: 5 * ONE_MINUTE,
  [CacheResource.USER_METRICS]: 5 * ONE_MINUTE,
  [CacheResource.APPOINTMENT_METRICS]: 5 * ONE_MINUTE,
  [CacheResource.BARBER_METRICS]: 5 * ONE_MINUTE,
  [CacheResource.CUSTOMER_METRICS]: 5 * ONE_MINUTE,
  [CacheResource.OCCUPATION_METRICS]: 5 * ONE_MINUTE,
};

const DEFAULT_TTL_SECONDS = ONE_HOUR;

@Injectable()
export class StaticCachePolicy implements CachePolicy {
  resolveTtlSeconds(resource: CacheResource): number {
    return TTL_SECONDS_BY_RESOURCE[resource] ?? DEFAULT_TTL_SECONDS;
  }
}
