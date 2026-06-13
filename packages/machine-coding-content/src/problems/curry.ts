import type { MachineCodingProblem } from "../types";

const DESCRIPTION = `# Curry

Implement \`curry(fn)\`. It returns a curried version of \`fn\` that collects
arguments across multiple calls until it has received at least as many as \`fn\`
declares (\`fn.length\`), then invokes \`fn\` with all of them.

\`\`\`ts
const sum = (a, b, c) => a + b + c;
const curried = curry(sum);
curried(1)(2)(3); // 6
curried(1, 2)(3); // 6
curried(1)(2, 3); // 6
curried(1, 2, 3); // 6
\`\`\`

## Requirements

- Accept any mix of arguments per call until enough are gathered.
- Invoke \`fn\` only once it has \`fn.length\` (or more) arguments.
- Return \`fn\`'s result once it runs.

Open \`src/curry.ts\` and implement the function.
`;

const EDITORIAL = `# Solution

Capture the target arity once (\`fn.length\`). Each call concatenates its arguments
onto the ones gathered so far; if that meets the arity, call \`fn\`, otherwise
return a function that waits for more.

\`\`\`ts
type AnyFn = (...args: never[]) => unknown;

export function curry(fn: AnyFn): (...args: unknown[]) => unknown {
  const arity = fn.length;
  return function curried(...args: unknown[]): unknown {
    if (args.length >= arity) {
      return (fn as (...a: unknown[]) => unknown)(...args);
    }
    return (...more: unknown[]) => curried(...args, ...more);
  };
}
\`\`\`

Typing a fully generic curry precisely is famously hard; here we type the public
contract (\`unknown\` in, \`unknown\` out) and keep one controlled cast where the
collected args are applied to \`fn\`.
`;

export const curry: MachineCodingProblem = {
  slug: "curry",
  title: "Curry",
  difficulty: "medium",
  category: "js-utility",
  durationMinutes: 30,
  tags: ["Closures", "Recursion", "Functional"],
  companies: ["Meta", "Amazon", "Uber"],
  templateId: "vanilla-ts",
  displayOrder: 40,
  description: DESCRIPTION,
  editorial: EDITORIAL,
  starterFiles: {
    "src/curry.ts": `type AnyFn = (...args: never[]) => unknown;

/**
 * Return a curried version of \`fn\` that gathers args until it has \`fn.length\`
 * of them, then invokes \`fn\`.
 */
export function curry(fn: AnyFn): (...args: unknown[]) => unknown {
  // TODO: implement
  return () => undefined;
}
`,
    "src/main.ts": `import { curry } from "./curry";

const sum = (a: number, b: number, c: number) => a + b + c;
const add = curry(sum) as (a: number) => (b: number) => (c: number) => number;

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML =
  "<h1>Curry</h1>" +
  "<p>const add = curry((a, b, c) => a + b + c)</p>" +
  "<p>add(1)(2)(3) = " + add(1)(2)(3) + "</p>";
`,
  },
  solutionFiles: {
    "src/curry.ts": `type AnyFn = (...args: never[]) => unknown;

/**
 * Return a curried version of \`fn\` that gathers args until it has \`fn.length\`
 * of them, then invokes \`fn\`.
 */
export function curry(fn: AnyFn): (...args: unknown[]) => unknown {
  const arity = fn.length;
  return function curried(...args: unknown[]): unknown {
    if (args.length >= arity) {
      return (fn as (...a: unknown[]) => unknown)(...args);
    }
    return (...more: unknown[]) => curried(...args, ...more);
  };
}
`,
  },
  testFiles: {
    "src/curry.test.ts": `import { curry } from "./curry";
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
`,
  },
};
