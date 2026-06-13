/**
 * Run `tasks` with at most `limit` in flight at once, resolving to their
 * results in input order.
 */
export async function promisePool(tasks, limit) {
  const results = new Array(tasks.length);
  let next = 0;

  async function worker() {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  }

  const size = Math.min(Math.max(limit, 1), tasks.length);
  await Promise.all(Array.from({ length: size }, () => worker()));
  return results;
}
