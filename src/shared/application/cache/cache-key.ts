/**
 * A single, fully-qualified cache entry key (e.g. "barber:42"). Always
 * built through CacheKeyGenerator so key formats stay centralized instead
 * of scattered across use-case wiring.
 */
export class CacheKey {
  private constructor(private readonly value: string) {}

  static of(value: string): CacheKey {
    return new CacheKey(value);
  }

  toString(): string {
    return this.value;
  }
}
