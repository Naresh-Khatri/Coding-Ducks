import type { MachineCodingProblem } from "../types";

const DESCRIPTION = `# Debounce

Implement \`debounce(fn, wait)\`. It returns a function that postpones calling
\`fn\` until \`wait\` milliseconds have passed since the **last** time the
returned function was invoked. Rapid calls reset the timer.

\`\`\`ts
const log = debounce(() => console.log("saved"), 300);
log(); log(); log(); // "saved" prints once, 300ms after the last call
\`\`\`

## Requirements

- Only the final call in a burst actually runs \`fn\`.
- \`fn\` receives the **arguments from the most recent call**.
- The delay is measured from the last invocation, not the first.

Open \`src/debounce.ts\` and implement the function.
`;

const EDITORIAL = `# Solution

Keep a single timer handle in the closure. Each call clears the pending timer
and schedules a fresh one, so only the last call survives the \`wait\` window.

\`\`\`ts
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return function (this: unknown, ...args: A) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}
\`\`\`

The generic \`A extends unknown[]\` threads the wrapped function's parameter types
through to the debounced one, so calls stay type-checked. Using \`function\` (not
an arrow) and \`fn.apply(this, args)\` preserves the caller's \`this\`, which
matters when the debounced function is used as a method.
`;

export const debounce: MachineCodingProblem = {
  slug: "debounce",
  title: "Debounce",
  difficulty: "easy",
  category: "js-utility",
  durationMinutes: 20,
  tags: ["Closures", "Timers"],
  companies: ["Google", "Meta", "Airbnb"],
  templateId: "vanilla-ts",
  displayOrder: 20,
  description: DESCRIPTION,
  editorial: EDITORIAL,
  starterFiles: {
    "src/debounce.ts": `/**
 * Return a debounced version of \`fn\` that only runs \`wait\` ms after the
 * last call.
 */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
): (...args: A) => void {
  // TODO: implement
  return () => {};
}
`,
    "src/main.ts": `import "./style.css";

import { debounce } from "./debounce";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = \`
  <h1>Debounce</h1>
  <input id="box" placeholder="type fast…" />
  <p id="out">fired 0×</p>
\`;

const out = document.querySelector<HTMLParagraphElement>("#out")!;
let calls = 0;
const onType = debounce(() => {
  out.textContent = \`fired \${++calls}×\`;
}, 400);
document.querySelector<HTMLInputElement>("#box")!.addEventListener("input", onType);
`,
  },
  solutionFiles: {
    "src/debounce.ts": `/**
 * Return a debounced version of \`fn\` that only runs \`wait\` ms after the
 * last call.
 */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return function (this: unknown, ...args: A) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}
`,
  },
  testFiles: {
    "src/debounce.test.ts": `import { vi } from "vitest";

import { debounce } from "./debounce";
import { cases } from "./mc-test";

cases("debounce", [
  {
    name: "does not call fn before the wait elapses",
    input: "call once, then check the call count at 0ms / 99ms / 100ms",
    expected: { at0: 0, at99: 0, at100: 1 },
    run: () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      debounced();
      const at0 = fn.mock.calls.length;
      vi.advanceTimersByTime(99);
      const at99 = fn.mock.calls.length;
      vi.advanceTimersByTime(1);
      const at100 = fn.mock.calls.length;
      vi.useRealTimers();
      return { at0, at99, at100 };
    },
  },
  {
    name: "collapses a burst into a single call",
    input: "3 calls in a row, then wait 100ms",
    expected: { calls: 1 },
    run: () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      debounced();
      debounced();
      debounced();
      vi.advanceTimersByTime(100);
      vi.useRealTimers();
      return { calls: fn.mock.calls.length };
    },
  },
  {
    name: "uses the arguments from the most recent call",
    input: "call with 1, then 2, then wait 100ms",
    expected: { calledWith: [2] },
    run: () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      debounced(1);
      debounced(2);
      vi.advanceTimersByTime(100);
      const calls = fn.mock.calls;
      vi.useRealTimers();
      return { calledWith: calls[calls.length - 1] ?? null };
    },
  },
  {
    name: "measures the delay from the last call",
    input: "call, wait 60ms, call again, then check at 60ms / 100ms after the 2nd call",
    expected: { at60: 0, at100: 1 },
    run: () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      debounced();
      vi.advanceTimersByTime(60);
      debounced();
      vi.advanceTimersByTime(60);
      const at60 = fn.mock.calls.length;
      vi.advanceTimersByTime(40);
      const at100 = fn.mock.calls.length;
      vi.useRealTimers();
      return { at60, at100 };
    },
  },
]);
`,
  },
};
