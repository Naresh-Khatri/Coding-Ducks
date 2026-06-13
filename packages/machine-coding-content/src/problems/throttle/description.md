# Throttle

Implement `throttle(fn, wait)`. It returns a function that invokes `fn` at most
once every `wait` milliseconds. The **first** call runs immediately; any calls
during the cooldown window are dropped. Once the window passes, the next call
runs immediately again and opens a fresh window.

```ts
const onScroll = throttle(() => console.log("scrolled"), 200);
window.addEventListener("scroll", onScroll); // fires at most every 200ms
```

## Requirements

- The first call runs `fn` immediately (leading edge).
- Calls made during the `wait` window after a run are ignored.
- After the window elapses, the next call runs and starts a new window.
- `fn` is called with the arguments of the call that triggered it.

Open `src/throttle.ts` and implement the function.
