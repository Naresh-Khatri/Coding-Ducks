import { promisePool } from "./promise-pool";
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
