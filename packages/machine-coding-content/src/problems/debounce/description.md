# Debounce

Implement `debounce(fn, wait)`. It returns a function that postpones calling
`fn` until `wait` milliseconds have passed since the **last** time the
returned function was invoked. Rapid calls reset the timer.

```ts
const log = debounce(() => console.log("saved"), 300);
log(); log(); log(); // "saved" prints once, 300ms after the last call
```

## Requirements

- Only the final call in a burst actually runs `fn`.
- `fn` receives the **arguments from the most recent call**.
- The delay is measured from the last invocation, not the first.

Open `src/debounce.ts` and implement the function.
