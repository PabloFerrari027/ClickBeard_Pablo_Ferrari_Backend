import { CacheInvalidatingUseCase } from './cache-invalidating-use-case';
import { CacheKey } from './cache-key';
import { CacheKeyPrefix } from './cache-key-prefix';
import { CacheInvalidationService } from '../ports/cache-invalidation-service.port';
import { UseCase } from '../use-case';

interface Input {
  id: string;
}

interface Output {
  id: string;
}

describe('CacheInvalidatingUseCase', () => {
  let innerUseCase: jest.Mocked<UseCase<Input, Output>>;
  let cacheInvalidationService: jest.Mocked<CacheInvalidationService>;

  beforeEach(() => {
    innerUseCase = { execute: jest.fn() };
    cacheInvalidationService = {
      invalidateKeys: jest.fn(),
      invalidatePrefixes: jest.fn(),
    };
  });

  it('runs the inner use case before invalidating anything', async () => {
    const callOrder: string[] = [];
    innerUseCase.execute.mockImplementation(() => {
      callOrder.push('execute');
      return Promise.resolve({ id: 'barber-1' });
    });
    cacheInvalidationService.invalidateKeys.mockImplementation(() => {
      callOrder.push('invalidate');
      return Promise.resolve();
    });

    const useCase = new CacheInvalidatingUseCase(
      innerUseCase,
      cacheInvalidationService,
      { buildKeys: (input) => [CacheKey.of(`barber:${input.id}`)] },
    );

    await useCase.execute({ id: 'barber-1' });

    expect(callOrder).toEqual(['execute', 'invalidate']);
  });

  it('invalidates keys built from both input and output', async () => {
    innerUseCase.execute.mockResolvedValue({ id: 'barber-1' });

    const useCase = new CacheInvalidatingUseCase(
      innerUseCase,
      cacheInvalidationService,
      {
        buildKeys: (input, output) => [
          CacheKey.of(`barber:${input.id}`),
          CacheKey.of(`barber:${output.id}`),
        ],
      },
    );

    await useCase.execute({ id: 'barber-1' });

    expect(cacheInvalidationService.invalidateKeys).toHaveBeenCalledWith([
      expect.objectContaining({}) as unknown,
      expect.objectContaining({}) as unknown,
    ]);
    const keys = cacheInvalidationService.invalidateKeys.mock.calls[0][0];
    expect(keys.map((key) => key.toString())).toEqual([
      'barber:barber-1',
      'barber:barber-1',
    ]);
  });

  it('invalidates prefixes when configured', async () => {
    innerUseCase.execute.mockResolvedValue({ id: 'barber-1' });

    const useCase = new CacheInvalidatingUseCase(
      innerUseCase,
      cacheInvalidationService,
      {
        buildPrefixes: () => [CacheKeyPrefix.of('barbers:list:')],
      },
    );

    await useCase.execute({ id: 'barber-1' });

    const prefixes =
      cacheInvalidationService.invalidatePrefixes.mock.calls[0][0];
    expect(prefixes.map((prefix) => prefix.toString())).toEqual([
      'barbers:list:',
    ]);
  });

  it('does not call the invalidation service when no keys or prefixes are configured', async () => {
    innerUseCase.execute.mockResolvedValue({ id: 'barber-1' });

    const useCase = new CacheInvalidatingUseCase(
      innerUseCase,
      cacheInvalidationService,
      {},
    );

    await useCase.execute({ id: 'barber-1' });

    expect(cacheInvalidationService.invalidateKeys).not.toHaveBeenCalled();
    expect(cacheInvalidationService.invalidatePrefixes).not.toHaveBeenCalled();
  });

  it('returns the inner use case output unchanged', async () => {
    innerUseCase.execute.mockResolvedValue({ id: 'barber-1' });

    const useCase = new CacheInvalidatingUseCase(
      innerUseCase,
      cacheInvalidationService,
      {},
    );

    const result = await useCase.execute({ id: 'barber-1' });

    expect(result).toEqual({ id: 'barber-1' });
  });
});
