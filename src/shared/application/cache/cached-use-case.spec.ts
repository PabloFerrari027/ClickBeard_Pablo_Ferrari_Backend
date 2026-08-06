import { CacheKey } from './cache-key';
import { CacheResource } from './cache-resource.enum';
import { CachedUseCase } from './cached-use-case';
import { CacheManager } from '../ports/cache-manager.port';
import { CachePolicy } from '../ports/cache-policy.port';
import { UseCase } from '../use-case';

interface Input {
  id: string;
}

interface Output {
  value: string;
}

describe('CachedUseCase', () => {
  let innerUseCase: jest.Mocked<UseCase<Input, Output>>;
  let cacheManager: jest.Mocked<CacheManager>;
  let cachePolicy: jest.Mocked<CachePolicy>;
  let cachedUseCase: CachedUseCase<Input, Output>;

  beforeEach(() => {
    innerUseCase = { execute: jest.fn() };
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      deleteByPrefix: jest.fn(),
    };
    cachePolicy = { resolveTtlSeconds: jest.fn().mockReturnValue(120) };
    cachedUseCase = new CachedUseCase(innerUseCase, cacheManager, cachePolicy, {
      resource: CacheResource.BARBER,
      buildKey: (input) => CacheKey.of(`barber:${input.id}`),
    });
  });

  it('returns the cached value without calling the inner use case on a hit', async () => {
    cacheManager.get.mockResolvedValue({ value: 'cached' });

    const result = await cachedUseCase.execute({ id: 'barber-1' });

    expect(result).toEqual({ value: 'cached' });
    expect(innerUseCase.execute).not.toHaveBeenCalled();
    expect(cacheManager.set).not.toHaveBeenCalled();
  });

  it('executes the inner use case and populates the cache on a miss', async () => {
    cacheManager.get.mockResolvedValue(null);
    innerUseCase.execute.mockResolvedValue({ value: 'fresh' });

    const result = await cachedUseCase.execute({ id: 'barber-1' });

    expect(result).toEqual({ value: 'fresh' });
    expect(innerUseCase.execute).toHaveBeenCalledWith({ id: 'barber-1' });
    expect(cacheManager.get).toHaveBeenCalledWith(
      expect.objectContaining({ value: expect.anything() }) as unknown,
    );
    expect(cacheManager.set).toHaveBeenCalledWith(
      expect.anything(),
      { value: 'fresh' },
      { ttlSeconds: 120 },
    );
  });

  it('resolves the TTL from the configured resource', async () => {
    cacheManager.get.mockResolvedValue(null);
    innerUseCase.execute.mockResolvedValue({ value: 'fresh' });

    await cachedUseCase.execute({ id: 'barber-1' });

    expect(cachePolicy.resolveTtlSeconds).toHaveBeenCalledWith(
      CacheResource.BARBER,
    );
  });

  it('builds the cache key from the input via the configured strategy', async () => {
    cacheManager.get.mockResolvedValue(null);
    innerUseCase.execute.mockResolvedValue({ value: 'fresh' });

    await cachedUseCase.execute({ id: 'barber-42' });

    const key = cacheManager.get.mock.calls[0][0];
    expect(key.toString()).toBe('barber:barber-42');
  });
});
