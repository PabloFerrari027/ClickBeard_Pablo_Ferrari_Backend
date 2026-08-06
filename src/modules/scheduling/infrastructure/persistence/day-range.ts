/** [start, end) bounds of `date`'s local calendar day, for `start_at` range queries. */
export function getDayRange(date: Date): { start: Date; end: Date } {
  return {
    start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
    end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
  };
}
