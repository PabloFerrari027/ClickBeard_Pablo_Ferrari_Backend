export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 100;

/** Falls back to `DEFAULT_PAGE` for anything not a positive page number. */
export function resolvePage(page?: number): number {
  return page && page > 0 ? page : DEFAULT_PAGE;
}

export function computeTotalPages(
  total: number,
  limit: number = DEFAULT_LIMIT,
): number {
  return Math.ceil(total / limit);
}
