import type { MachineCodingProblem } from "../types";

const DESCRIPTION = `# Flatten Array

Implement \`flatten(value)\` which takes a deeply nested array and returns a new,
fully flattened array — every nested level collapsed into a single flat array,
left to right.

\`\`\`js
flatten([1, [2, [3, [4]], 5]]); // → [1, 2, 3, 4, 5]
\`\`\`

## Requirements

- Flatten arrays of **arbitrary depth**.
- Preserve the original left-to-right order.
- Don't mutate the input.
- An already-flat array (or an empty array) comes back unchanged.

Open \`src/flatten.ts\` and implement the function. Run the tests when you're done.
`;

const EDITORIAL = `# Solution

Walk the array; when an element is itself an array, recurse and spread its
flattened result into the output, otherwise push the value.

\`\`\`js
export function flatten(value) {
  const out = [];
  for (const item of value) {
    if (Array.isArray(item)) out.push(...flatten(item));
    else out.push(item);
  }
  return out;
}
\`\`\`

**Complexity:** O(n) in the total number of elements. For very deep arrays an
iterative stack-based version avoids blowing the call stack, but recursion reads
clearest in an interview.
`;

export const flattenArray: MachineCodingProblem = {
  slug: "flatten-array",
  title: "Flatten Array",
  difficulty: "easy",
  category: "js-utility",
  durationMinutes: 15,
  tags: ["Recursion", "Arrays"],
  companies: ["Meta", "Amazon"],
  templateId: "vanilla-ts",
  displayOrder: 10,
  description: DESCRIPTION,
  editorial: EDITORIAL,
  starterFiles: {
    "src/flatten.ts": `/**
 * Flatten a deeply nested array into a single flat array, preserving order.
 */
export function flatten(value) {
  // TODO: implement
  return value;
}
`,
    "src/main.ts": `import { flatten } from "./flatten";

const app = document.querySelector<HTMLDivElement>("#app")!;
const input = [1, [2, [3, [4]], 5]];
app.innerHTML = \`
  <h1>Flatten Array</h1>
  <p>input: <code>\${JSON.stringify(input)}</code></p>
  <p>output: <code>\${JSON.stringify(flatten(input))}</code></p>
  <p>Run the tests from the Problem panel.</p>
\`;
`,
  },
  solutionFiles: {
    "src/flatten.ts": `/**
 * Flatten a deeply nested array into a single flat array, preserving order.
 */
export function flatten(value) {
  const out = [];
  for (const item of value) {
    if (Array.isArray(item)) out.push(...flatten(item));
    else out.push(item);
  }
  return out;
}
`,
  },
  testFiles: {
    "src/flatten.test.ts": `import { flatten } from "./flatten";
import { cases } from "./mc-test";

cases("flatten", flatten, [
  {
    name: "flattens a deeply nested array",
    input: [1, [2, [3, [4]], 5]],
    expected: [1, 2, 3, 4, 5],
  },
  {
    name: "leaves an already-flat array unchanged",
    input: [1, 2, 3],
    expected: [1, 2, 3],
  },
  { name: "handles an empty array", input: [], expected: [] },
  {
    name: "preserves left-to-right order",
    input: [[1], [2, [3]], 4],
    expected: [1, 2, 3, 4],
  },
  {
    name: "does not mutate the input",
    input: [1, [2, 3]],
    expected: [1, [2, 3]],
    run: (input) => {
      flatten(input);
      return input;
    },
  },
]);
`,
  },
};
