# Solution

Track a single "cooling" flag. While it's clear, run `fn` immediately, raise the
flag, and lower it again after `wait` ms via `setTimeout`. While it's raised,
calls are ignored.

```ts
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
```

This is the **leading-edge** variant. A common follow-up is to also fire once on
the **trailing edge** — remember the last args seen during the window and invoke
them when it closes — which is what Lodash does by default.
