# Solution

Capture the target arity once (`fn.length`). Each call concatenates its arguments
onto the ones gathered so far; if that meets the arity, call `fn`, otherwise
return a function that waits for more.

```ts
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
```

Typing a fully generic curry precisely is famously hard; here we type the public
contract (`unknown` in, `unknown` out) and keep one controlled cast where the
collected args are applied to `fn`.
