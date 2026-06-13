# Solution

Spawn `limit` "workers" that share a moving cursor into `tasks`. Each worker
loops: grab the next index, run that task, store its result at the matching slot,
repeat until the tasks run out. `Promise.all` over the workers waits for them all.

```ts
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
```

Storing each result by its captured `index` is what keeps the output ordered even
though tasks finish out of order. Because `next++` is synchronous, no two workers
ever grab the same task.
