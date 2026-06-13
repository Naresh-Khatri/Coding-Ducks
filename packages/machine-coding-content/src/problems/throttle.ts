import type { MachineCodingProblem } from "../types";

const DESCRIPTION = `# Throttle

Implement \`throttle(fn, wait)\`. It returns a function that invokes \`fn\` at most
once every \`wait\` milliseconds. The **first** call runs immediately; any calls
during the cooldown window are dropped. Once the window passes, the next call
runs immediately again and opens a fresh window.

\`\`\`ts
const onScroll = throttle(() => console.log("scrolled"), 200);
window.addEventListener("scroll", onScroll); // fires at most every 200ms
\`\`\`

## Requirements

- The first call runs \`fn\` immediately (leading edge).
- Calls made during the \`wait\` window after a run are ignored.
- After the window elapses, the next call runs and starts a new window.
- \`fn\` is called with the arguments of the call that triggered it.

Open \`src/throttle.ts\` and implement the function.
`;

const EDITORIAL = `# Solution

Track a single "cooling" flag. While it's clear, run \`fn\` immediately, raise the
flag, and lower it again after \`wait\` ms via \`setTimeout\`. While it's raised,
calls are ignored.

\`\`\`ts
export function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
): (...args: A) => void {
  let cooling = false;
  return function (this: unknown, ...args: A) {
    if (cooling) return;
    fn.apply(this, args);
    cooling = true;
    setTimeout(() => {
      cooling = false;
    }, wait);
  };
}
\`\`\`

This is the **leading-edge** variant. A common follow-up is to also fire once on
the **trailing edge** — remember the last args seen during the window and invoke
them when it closes — which is what Lodash does by default.
`;

export const throttle: MachineCodingProblem = {
  slug: "throttle",
  title: "Throttle",
  difficulty: "easy",
  category: "js-utility",
  durationMinutes: 20,
  tags: ["Closures", "Timers", "Rate limiting"],
  companies: ["Google", "Meta", "Stripe"],
  templateId: "vanilla-ts",
  displayOrder: 30,
  description: DESCRIPTION,
  editorial: EDITORIAL,
  starterFiles: {
    "src/throttle.ts": `/**
 * Return a throttled version of \`fn\` that runs at most once per \`wait\` ms.
 */
export function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
): (...args: A) => void {
  // TODO: implement
  return () => {};
}
`,
    "src/main.ts": `import { throttle } from "./throttle";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML =
  "<h1>Throttle</h1>" +
  '<button id="tick">click me fast</button>' +
  '<p id="out">handled 0×</p>';

const out = document.querySelector<HTMLParagraphElement>("#out")!;
let handled = 0;
const onClick = throttle(() => {
  out.textContent = "handled " + ++handled + "×";
}, 500);
document
  .querySelector<HTMLButtonElement>("#tick")!
  .addEventListener("click", onClick);
`,
  },
  solutionFiles: {
    "src/throttle.ts": `/**
 * Return a throttled version of \`fn\` that runs at most once per \`wait\` ms.
 */
export function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
): (...args: A) => void {
  let cooling = false;
  return function (this: unknown, ...args: A) {
    if (cooling) return;
    fn.apply(this, args);
    cooling = true;
    setTimeout(() => {
      cooling = false;
    }, wait);
  };
}
`,
  },
  testFiles: {
    "src/throttle.test.ts": `import { vi } from "vitest";

import { throttle } from "./throttle";
import { cases } from "./mc-test";

cases("throttle", [
  {
    name: "runs immediately on the first call",
    input: "call once",
    expected: { calls: 1 },
    run: () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const throttled = throttle(fn, 100);
      throttled();
      const calls = fn.mock.calls.length;
      vi.useRealTimers();
      return { calls };
    },
  },
  {
    name: "ignores calls during the cooldown window",
    input: "3 calls back-to-back",
    expected: { calls: 1 },
    run: () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const throttled = throttle(fn, 100);
      throttled();
      throttled();
      throttled();
      const calls = fn.mock.calls.length;
      vi.useRealTimers();
      return { calls };
    },
  },
  {
    name: "allows another call after the window elapses",
    input: "call, wait 100ms, call again",
    expected: { calls: 2 },
    run: () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const throttled = throttle(fn, 100);
      throttled();
      vi.advanceTimersByTime(100);
      throttled();
      const calls = fn.mock.calls.length;
      vi.useRealTimers();
      return { calls };
    },
  },
  {
    name: "passes through the arguments of the invoking call",
    input: "call with 7",
    expected: { calledWith: [7] },
    run: () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const throttled = throttle(fn, 100);
      throttled(7);
      const calls = fn.mock.calls;
      vi.useRealTimers();
      return { calledWith: calls[0] ?? null };
    },
  },
]);
`,
  },
};
