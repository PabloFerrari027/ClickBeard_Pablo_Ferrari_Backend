import { CacheKey } from './cache-key';
import { CacheResource } from './cache-resource.enum';
import { CacheManager } from '../ports/cache-manager.port';
import { CachePolicy } from '../ports/cache-policy.port';
import { UseCase } from '../use-case';

export interface CacheAsideOptions<Input> {
  resource: CacheResource;
  buildKey: (input: Input) => CacheKey;
}

/**
 * Cache-aside decorator: wraps a read use case so callers get caching
 * without the use case ever knowing a cache exists. On a miss, runs the
 * wrapped use case and populates the cache with its result before
 * returning it — the wrapped use case's own logic never changes.
 */
export class CachedUseCase<Input, Output> implements UseCase<Input, Output> {
  constructor(
    private readonly useCase: UseCase<Input, Output>,
    private readonly cacheManager: CacheManager,
    private readonly cachePolicy: CachePolicy,
    private readonly options: CacheAsideOptions<Input>,
  ) {}

  async execute(input: Input): Promise<Output> {
    const key = this.options.buildKey(input);
    const cached = await this.cacheManager.get<Output>(key);

    if (cached !== null) {
      return cached;
    }

    const output = await this.useCase.execute(input);

    await this.cacheManager.set(key, output, {
      ttlSeconds: this.cachePolicy.resolveTtlSeconds(this.options.resource),
    });

    return output;
  }
}
