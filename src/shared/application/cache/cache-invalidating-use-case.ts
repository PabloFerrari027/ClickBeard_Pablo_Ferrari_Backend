import { CacheKey } from './cache-key';
import { CacheKeyPrefix } from './cache-key-prefix';
import { CacheInvalidationService } from '../ports/cache-invalidation-service.port';
import { UseCase } from '../use-case';

export interface CacheInvalidationOptions<Input, Output> {
  buildKeys?: (input: Input, output: Output) => CacheKey[];
  buildPrefixes?: (input: Input, output: Output) => CacheKeyPrefix[];
}

/**
 * Synchronous invalidation decorator: wraps a write use case so that,
 * once it persists its change, the caches it makes stale are cleared
 * before the result is returned to the caller — never via an async
 * domain event, so the very next read is guaranteed fresh. The wrapped
 * use case's own logic never changes or knows this is happening.
 */
export class CacheInvalidatingUseCase<Input, Output> implements UseCase<
  Input,
  Output
> {
  constructor(
    private readonly useCase: UseCase<Input, Output>,
    private readonly cacheInvalidationService: CacheInvalidationService,
    private readonly options: CacheInvalidationOptions<Input, Output>,
  ) {}

  async execute(input: Input): Promise<Output> {
    const output = await this.useCase.execute(input);

    const keys = this.options.buildKeys?.(input, output) ?? [];
    const prefixes = this.options.buildPrefixes?.(input, output) ?? [];

    if (keys.length > 0) {
      await this.cacheInvalidationService.invalidateKeys(keys);
    }

    if (prefixes.length > 0) {
      await this.cacheInvalidationService.invalidatePrefixes(prefixes);
    }

    return output;
  }
}
