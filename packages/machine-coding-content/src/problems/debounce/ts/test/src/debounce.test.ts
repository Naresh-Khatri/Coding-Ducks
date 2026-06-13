import { vi } from "vitest";

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
