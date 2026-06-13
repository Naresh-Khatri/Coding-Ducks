/**
 * Run `tasks` with at most `limit` in flight at once, resolving to their
 * results in input order.
 */
export async function promisePool<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<T[]> {
  // TODO: implement
  return [];
}
