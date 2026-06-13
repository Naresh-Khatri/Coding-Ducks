# Promise Pool

Implement `promisePool(tasks, limit)`. `tasks` is an array of functions, each
returning a promise. Run them with **at most `limit` running at the same time**,
and resolve to an array of results in the **same order as `tasks`** (not the
order they finish).

```ts
const results = await promisePool(
  [() => fetchUser(1), () => fetchUser(2), () => fetchUser(3)],
  2, // at most 2 in flight at once
);
```

## Requirements

- Never run more than `limit` tasks concurrently.
- Resolve with results aligned to the input order.
- Resolve only after every task has finished.
- An empty task list resolves to `[]`.

Open `src/promise-pool.ts` and implement the function.
