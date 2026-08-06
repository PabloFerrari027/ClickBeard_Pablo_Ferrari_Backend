/**
 * A key prefix (e.g. "barbers:list:") used to invalidate every cache
 * entry in a family at once — needed whenever a write affects a
 * paginated or parameterized collection whose exact cached keys aren't
 * individually known (e.g. every page of a list).
 */
export class CacheKeyPrefix {
  private constructor(private readonly value: string) {}

  static of(value: string): CacheKeyPrefix {
    return new CacheKeyPrefix(value);
  }

  toString(): string {
    return this.value;
  }
}
