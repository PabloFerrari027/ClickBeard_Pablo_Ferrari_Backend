import { CacheManagerInvalidationService } from './cache-manager-invalidation.service';
import { CacheKey } from '../application/cache/cache-key';
import { CacheKeyPrefix } from '../application/cache/cache-key-prefix';
import { CacheManager } from '../application/ports/cache-manager.port';

describe('CacheManagerInvalidationService', () => {
  let cacheManager: jest.Mocked<CacheManager>;
  let service: CacheManagerInvalidationService;

  beforeEach(() => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      deleteByPrefix: jest.fn(),
    };
    service = new CacheManagerInvalidationService(cacheManager);
  });

  describe('invalidateKeys', () => {
    it('deletes every key via the cache manager', async () => {
      const keys = [CacheKey.of('a'), CacheKey.of('b')];

      await service.invalidateKeys(keys);

      expect(cacheManager.delete).toHaveBeenCalledTimes(2);
      expect(cacheManager.delete).toHaveBeenCalledWith(keys[0]);
      expect(cacheManager.delete).toHaveBeenCalledWith(keys[1]);
    });

    it('does nothing for an empty list', async () => {
      await service.invalidateKeys([]);

      expect(cacheManager.delete).not.toHaveBeenCalled();
    });
  });

  describe('invalidatePrefixes', () => {
    it('deletes every prefix via the cache manager', async () => {
      const prefixes = [CacheKeyPrefix.of('a:'), CacheKeyPrefix.of('b:')];

      await service.invalidatePrefixes(prefixes);

      expect(cacheManager.deleteByPrefix).toHaveBeenCalledTimes(2);
      expect(cacheManager.deleteByPrefix).toHaveBeenCalledWith(prefixes[0]);
      expect(cacheManager.deleteByPrefix).toHaveBeenCalledWith(prefixes[1]);
    });
  });
});
