import type Redis from 'ioredis';

import { RedisCacheManager } from './redis-cache-manager';
import { CacheKey } from '../application/cache/cache-key';
import { CacheKeyPrefix } from '../application/cache/cache-key-prefix';

describe('RedisCacheManager', () => {
  let redis: jest.Mocked<Redis>;
  let cacheManager: RedisCacheManager;

  beforeEach(() => {
    redis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      scan: jest.fn(),
    } as unknown as jest.Mocked<Redis>;
    cacheManager = new RedisCacheManager(redis);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('get', () => {
    it('returns the parsed value on a hit', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ id: '1' }));

      const result = await cacheManager.get(CacheKey.of('user:1'));

      expect(redis.get).toHaveBeenCalledWith('user:1');
      expect(result).toEqual({ id: '1' });
    });

    it('returns null on a miss', async () => {
      redis.get.mockResolvedValue(null);

      const result = await cacheManager.get(CacheKey.of('user:1'));

      expect(result).toBeNull();
    });

    it('degrades to a miss instead of throwing when Redis fails', async () => {
      redis.get.mockRejectedValue(new Error('connection lost'));

      const result = await cacheManager.get(CacheKey.of('user:1'));

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('serializes the value and sets the TTL', async () => {
      redis.set.mockResolvedValue('OK');

      await cacheManager.set(
        CacheKey.of('user:1'),
        { id: '1' },
        {
          ttlSeconds: 300,
        },
      );

      expect(redis.set).toHaveBeenCalledWith(
        'user:1',
        JSON.stringify({ id: '1' }),
        'EX',
        300,
      );
    });

    it('silently drops the write instead of throwing when Redis fails', async () => {
      redis.set.mockRejectedValue(new Error('connection lost'));

      await expect(
        cacheManager.set(
          CacheKey.of('user:1'),
          { id: '1' },
          {
            ttlSeconds: 300,
          },
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('delete', () => {
    it('deletes the key', async () => {
      redis.del.mockResolvedValue(1);

      await cacheManager.delete(CacheKey.of('user:1'));

      expect(redis.del).toHaveBeenCalledWith('user:1');
    });

    it('does not throw when Redis fails', async () => {
      redis.del.mockRejectedValue(new Error('connection lost'));

      await expect(
        cacheManager.delete(CacheKey.of('user:1')),
      ).resolves.toBeUndefined();
    });
  });

  describe('deleteByPrefix', () => {
    it('scans and deletes every matching key across multiple batches', async () => {
      redis.scan
        .mockResolvedValueOnce(['5', ['barbers:list:1', 'barbers:list:2']])
        .mockResolvedValueOnce(['0', ['barbers:list:3']]);
      redis.del.mockResolvedValue(3);

      await cacheManager.deleteByPrefix(CacheKeyPrefix.of('barbers:list:'));

      expect(redis.scan).toHaveBeenCalledTimes(2);
      expect(redis.scan).toHaveBeenNthCalledWith(
        1,
        '0',
        'MATCH',
        'barbers:list:*',
        'COUNT',
        100,
      );
      expect(redis.scan).toHaveBeenNthCalledWith(
        2,
        '5',
        'MATCH',
        'barbers:list:*',
        'COUNT',
        100,
      );
      expect(redis.del).toHaveBeenCalledWith(
        'barbers:list:1',
        'barbers:list:2',
        'barbers:list:3',
      );
    });

    it('does not call del when no keys match', async () => {
      redis.scan.mockResolvedValueOnce(['0', []]);

      await cacheManager.deleteByPrefix(CacheKeyPrefix.of('nothing:'));

      expect(redis.del).not.toHaveBeenCalled();
    });

    it('does not throw when Redis fails', async () => {
      redis.scan.mockRejectedValue(new Error('connection lost'));

      await expect(
        cacheManager.deleteByPrefix(CacheKeyPrefix.of('barbers:list:')),
      ).resolves.toBeUndefined();
    });
  });
});
