# Curry

Implement `curry(fn)`. It returns a curried version of `fn` that collects
arguments across multiple calls until it has received at least as many as `fn`
declares (`fn.length`), then invokes `fn` with all of them.

```ts
const sum = (a, b, c) => a + b + c;
const curried = curry(sum);
curried(1)(2)(3); // 6
curried(1, 2)(3); // 6
curried(1)(2, 3); // 6
curried(1, 2, 3); // 6
```

## Requirements

- Accept any mix of arguments per call until enough are gathered.
- Invoke `fn` only once it has `fn.length` (or more) arguments.
- Return `fn`'s result once it runs.

Open `src/curry.ts` and implement the function.
