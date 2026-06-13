import type { MachineCodingProblem } from "../types";

const DESCRIPTION = `# Promise Pool

Implement \`promisePool(tasks, limit)\`. \`tasks\` is an array of functions, each
returning a promise. Run them with **at most \`limit\` running at the same time**,
and resolve to an array of results in the **same order as \`tasks\`** (not the
order they finish).

\`\`\`ts
const results = await promisePool(
  [() => fetchUser(1), () => fetchUser(2), () => fetchUser(3)],
  2, // at most 2 in flight at once
);
\`\`\`

## Requirements

- Never run more than \`limit\` tasks concurrently.
- Resolve with results aligned to the input order.
- Resolve only after every task has finished.
- An empty task list resolves to \`[]\`.

Open \`src/promise-pool.ts\` and implement the function.
`;

const EDITORIAL = `# Solution

Spawn \`limit\` "workers" that share a moving cursor into \`tasks\`. Each worker
loops: grab the next index, run that task, store its result at the matching slot,
repeat until the tasks run out. \`Promise.all\` over the workers waits for them all.

\`\`\`ts
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
\`\`\`

Storing each result by its captured \`index\` is what keeps the output ordered even
though tasks finish out of order. Because \`next++\` is synchronous, no two workers
ever grab the same task.
`;

export const promisePool: MachineCodingProblem = {
  slug: "promise-pool",
  title: "Promise Pool",
  difficulty: "hard",
  category: "js-utility",
  durationMinutes: 45,
  tags: ["Promises", "Async", "Concurrency"],
  companies: ["Google", "Stripe", "Uber"],
  templateId: "vanilla-ts",
  displayOrder: 70,
  description: DESCRIPTION,
  editorial: EDITORIAL,
  starterFiles: {
    "src/promise-pool.ts": `/**
 * Run \`tasks\` with at most \`limit\` in flight at once, resolving to their
 * results in input order.
 */
export async function promisePool<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<T[]> {
  // TODO: implement
  return [];
}
`,
    "src/main.ts": `import { promisePool } from "./promise-pool";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = "<h1>Promise Pool</h1><p>Running…</p>";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const tasks = [1, 2, 3, 4, 5].map((n) => async () => {
  await wait(100 * n);
  return n * n;
});

promisePool(tasks, 2).then((results) => {
  app.innerHTML =
    "<h1>Promise Pool</h1>" +
    "<p>squares (limit 2): <code>" + JSON.stringify(results) + "</code></p>";
});
`,
  },
  solutionFiles: {
    "src/promise-pool.ts": `/**
 * Run \`tasks\` with at most \`limit\` in flight at once, resolving to their
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
`,
  },
  testFiles: {
    "src/promise-pool.test.ts": `import { promisePool } from "./promise-pool";
import { cases } from "./mc-test";

const resolveAfter = <T>(ms: number, value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

cases("promisePool", [
  {
    name: "resolves results in input order",
    input: "tasks finishing out of order, limit 2",
    expected: ["a", "b", "c"],
    run: () =>
      promisePool(
        [
          () => resolveAfter(30, "a"),
          () => resolveAfter(10, "b"),
          () => resolveAfter(20, "c"),
        ],
        2,
      ),
  },
  {
    name: "never exceeds the concurrency limit",
    input: "6 tasks, limit 2 — track the peak in-flight count",
    expected: { peak: 2 },
    run: async () => {
      let active = 0;
      let peak = 0;
      const make = () => () => {
        active++;
        peak = Math.max(peak, active);
        return resolveAfter(20, null).then(() => {
          active--;
        });
      };
      await promisePool([make(), make(), make(), make(), make(), make()], 2);
      return { peak };
    },
  },
  {
    name: "runs every task",
    input: "5 tasks, limit 2",
    expected: { done: 5 },
    run: async () => {
      let done = 0;
      const tasks = Array.from({ length: 5 }, () => async () => {
        await resolveAfter(10, null);
        done++;
      });
      await promisePool(tasks, 2);
      return { done };
    },
  },
  {
    name: "handles fewer tasks than the limit",
    input: "2 tasks, limit 5",
    expected: ["x", "y"],
    run: () =>
      promisePool([() => resolveAfter(10, "x"), () => resolveAfter(10, "y")], 5),
  },
  {
    name: "resolves an empty task list to []",
    input: "[]",
    expected: [],
    run: () => promisePool([], 3),
  },
]);
`,
  },
};
