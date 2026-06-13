/**
 * Run `tasks` with at most `limit` in flight at once, resolving to their
 * results in input order.
 */
export async function promisePool<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;

  async function worker(): Promise<void> {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  }

  const size = Math.min(Math.max(limit, 1), tasks.length);
  await Promise.all(Array.from({ length: size }, () => worker()));
  return results;
}
