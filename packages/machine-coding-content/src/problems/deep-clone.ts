import type { MachineCodingProblem } from "../types";

const DESCRIPTION = `# Deep Clone

Implement \`deepClone(value)\` that returns a deep copy of \`value\`. Nested objects
and arrays are cloned recursively, so mutating the copy never affects the
original.

\`\`\`ts
const original = { a: 1, nested: { b: 2 } };
const copy = deepClone(original);
copy.nested.b = 99;
original.nested.b; // still 2
\`\`\`

## Requirements

- Primitives are returned as-is.
- Plain objects and arrays are cloned recursively — no shared references.
- \`Date\` values are cloned to a fresh \`Date\`.
- Handle **circular references** without infinite recursion.
- Never mutate the input.

Open \`src/deep-clone.ts\` and implement the function.
`;

const EDITORIAL = `# Solution

Recurse over the value. Primitives (and \`null\`) return immediately. Track
already-cloned objects in a \`WeakMap\` so shared and circular references resolve
to a single clone instead of looping forever.

\`\`\`ts
export function deepClone<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return new Date(value.getTime()) as T;

  const cached = seen.get(value);
  if (cached) return cached as T;

  if (Array.isArray(value)) {
    const copy: unknown[] = [];
    seen.set(value, copy);
    for (const item of value) copy.push(deepClone(item, seen));
    return copy as T;
  }

  const copy: Record<string, unknown> = {};
  seen.set(value, copy);
  for (const key of Object.keys(value)) {
    copy[key] = deepClone((value as Record<string, unknown>)[key], seen);
  }
  return copy as T;
}
\`\`\`

A production version would also handle \`Map\`, \`Set\`, \`RegExp\`, and typed arrays.
The built-in \`structuredClone\` covers most of these now, but writing the recursion
by hand is the point of the exercise.
`;

export const deepClone: MachineCodingProblem = {
  slug: "deep-clone",
  title: "Deep Clone",
  difficulty: "medium",
  category: "js-utility",
  durationMinutes: 30,
  tags: ["Recursion", "Objects"],
  companies: ["Google", "Amazon", "Microsoft"],
  templateId: "vanilla-ts",
  displayOrder: 50,
  description: DESCRIPTION,
  editorial: EDITORIAL,
  starterFiles: {
    "src/deep-clone.ts": `/**
 * Return a deep copy of \`value\`: nested objects/arrays cloned recursively,
 * \`Date\`s duplicated, and circular references handled.
 */
export function deepClone<T>(value: T): T {
  // TODO: implement
  return value;
}
`,
    "src/main.ts": `import { deepClone } from "./deep-clone";

const original = { a: 1, nested: { b: [2, 3] } };
const copy = deepClone(original);
copy.nested.b.push(4);

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML =
  "<h1>Deep Clone</h1>" +
  "<p>original: <code>" + JSON.stringify(original) + "</code></p>" +
  "<p>copy: <code>" + JSON.stringify(copy) + "</code></p>";
`,
  },
  solutionFiles: {
    "src/deep-clone.ts": `/**
 * Return a deep copy of \`value\`: nested objects/arrays cloned recursively,
 * \`Date\`s duplicated, and circular references handled.
 */
export function deepClone<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return new Date(value.getTime()) as T;

  const cached = seen.get(value);
  if (cached) return cached as T;

  if (Array.isArray(value)) {
    const copy: unknown[] = [];
    seen.set(value, copy);
    for (const item of value) copy.push(deepClone(item, seen));
    return copy as T;
  }

  const copy: Record<string, unknown> = {};
  seen.set(value, copy);
  for (const key of Object.keys(value)) {
    copy[key] = deepClone((value as Record<string, unknown>)[key], seen);
  }
  return copy as T;
}
`,
  },
  testFiles: {
    "src/deep-clone.test.ts": `import { deepClone } from "./deep-clone";
import { cases } from "./mc-test";

cases("deepClone", [
  {
    name: "deep-clones nested values",
    input: "{ a: 1, b: { c: [2, 3] } }",
    expected: { a: 1, b: { c: [2, 3] } },
    run: () => deepClone({ a: 1, b: { c: [2, 3] } }),
  },
  {
    name: "nested objects become new references",
    input: "clone.b !== original.b",
    expected: true,
    run: () => {
      const original = { b: { c: 1 } };
      const clone = deepClone(original);
      return clone.b !== original.b;
    },
  },
  {
    name: "mutating the clone leaves the original intact",
    input: "push to clone.b.c, then read original.b.c",
    expected: [2, 3],
    run: () => {
      const original = { b: { c: [2, 3] } };
      const clone = deepClone(original);
      clone.b.c.push(4);
      return original.b.c;
    },
  },
  {
    name: "clones Date instances",
    input: "deepClone({ d: new Date(0) })",
    expected: { sameTime: true, newReference: true },
    run: () => {
      const d = new Date(0);
      const clone = deepClone({ d });
      return { sameTime: clone.d.getTime() === 0, newReference: clone.d !== d };
    },
  },
  {
    name: "handles circular references",
    input: "an object whose .self points back to itself",
    expected: { selfReferential: true, isCopy: true },
    run: () => {
      interface Node {
        name: string;
        self?: Node;
      }
      const original: Node = { name: "x" };
      original.self = original;
      const clone = deepClone(original);
      return { selfReferential: clone.self === clone, isCopy: clone !== original };
    },
  },
]);
`,
  },
};
