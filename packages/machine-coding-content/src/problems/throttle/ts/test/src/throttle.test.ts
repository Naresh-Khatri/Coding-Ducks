import { vi } from "vitest";

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
