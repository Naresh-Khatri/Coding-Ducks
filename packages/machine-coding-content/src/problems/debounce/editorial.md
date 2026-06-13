# Solution

Keep a single timer handle in the closure. Each call clears the pending timer
and schedules a fresh one, so only the last call survives the `wait` window.

```ts
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
```

The generic `A extends unknown[]` threads the wrapped function's parameter types
through to the debounced one, so calls stay type-checked. Using `function` (not
an arrow) and `fn.apply(this, args)` preserves the caller's `this`, which
matters when the debounced function is used as a method.
