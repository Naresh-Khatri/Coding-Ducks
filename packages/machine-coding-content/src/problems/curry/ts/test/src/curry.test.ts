import { curry } from "./curry";
import { cases } from "./mc-test";

const sum3 = (a: number, b: number, c: number) => a + b + c;

// All calling shapes a 3-arg curry supports, expressed as overloads.
type Curried = ((a: number, b: number, c: number) => number) &
  ((a: number, b: number) => (c: number) => number) &
  ((
    a: number,
  ) => ((b: number, c: number) => number) &
    ((b: number) => (c: number) => number));

const curried = curry(sum3) as Curried;

cases("curry", [
  {
    name: "applies all arguments at once",
    input: "curried(1, 2, 3)",
    expected: 6,
    run: () => curried(1, 2, 3),
  },
  {
    name: "applies one argument at a time",
    input: "curried(1)(2)(3)",
    expected: 6,
    run: () => curried(1)(2)(3),
  },
  {
    name: "applies arguments in mixed batches",
    input: "curried(1, 2)(3)",
    expected: 6,
    run: () => curried(1, 2)(3),
  },
  {
    name: "supports a leading single argument",
    input: "curried(1)(2, 3)",
    expected: 6,
    run: () => curried(1)(2, 3),
  },
  {
    name: "waits until enough arguments arrive",
    input: "typeof curried(1)(2)",
    expected: "function",
    run: () => typeof curried(1)(2),
  },
]);
