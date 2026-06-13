# Event Emitter

Implement an `EventEmitter` class — a tiny publish/subscribe hub.

```ts
const bus = new EventEmitter();
const onPing = (msg) => console.log("ping:", msg);
bus.on("ping", onPing);
bus.emit("ping", "hello"); // logs: ping: hello
bus.off("ping", onPing);
bus.emit("ping", "hi"); // nothing happens
```

## Requirements

- `on(name, fn)` registers a listener for an event.
- `off(name, fn)` removes that exact listener.
- `emit(name, ...args)` calls every listener for `name`, in registration order, with `args`. Returns `true` if there were listeners, else `false`.
- `once(name, fn)` registers a listener that fires at most once.

Open `src/event-emitter.ts` and implement the class.
