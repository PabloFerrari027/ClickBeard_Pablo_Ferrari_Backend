import { StaticCachePolicy } from './static-cache-policy';
import { CacheResource } from '../application/cache/cache-resource.enum';

describe('StaticCachePolicy', () => {
  const policy = new StaticCachePolicy();

  it('resolves a TTL for every known resource', () => {
    for (const resource of Object.values(CacheResource)) {
      expect(policy.resolveTtlSeconds(resource)).toBeGreaterThan(0);
    }
  });

  it('gives available time slots the shortest TTL (30s)', () => {
    expect(policy.resolveTtlSeconds(CacheResource.AVAILABLE_TIME_SLOTS)).toBe(
      30,
    );
  });

  it('gives qualifications a longer TTL than user profiles', () => {
    const qualifications = policy.resolveTtlSeconds(
      CacheResource.QUALIFICATIONS,
    );
    const userProfile = policy.resolveTtlSeconds(CacheResource.USER_PROFILE);

    expect(qualifications).toBeGreaterThan(userProfile);
  });

  it('falls back to a default TTL for an unmapped resource', () => {
    const unmapped = 'SOMETHING_NEW' as CacheResource;

    expect(policy.resolveTtlSeconds(unmapped)).toBe(3600);
  });
});
