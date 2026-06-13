# Solution

Keep a `Map` from event name to a `Set` of listeners (a `Set` makes `off` O(1)
and de-dupes registrations). `once` wraps the listener so it removes itself before
delegating. `emit` iterates a **copy** of the set so a listener that removes
itself mid-emit doesn't make the loop skip the next one.

```ts
type Listener = (...args: unknown[]) => void;

export class EventEmitter {
  private listeners = new Map<string, Set<Listener>>();

  on(name: string, fn: Listener): this {
    const set = this.listeners.get(name) ?? new Set<Listener>();
    set.add(fn);
    this.listeners.set(name, set);
    return this;
  }

  off(name: string, fn: Listener): this {
    this.listeners.get(name)?.delete(fn);
    return this;
  }

  once(name: string, fn: Listener): this {
    const wrapper: Listener = (...args) => {
      this.off(name, wrapper);
      fn(...args);
    };
    return this.on(name, wrapper);
  }

  emit(name: string, ...args: unknown[]): boolean {
    const set = this.listeners.get(name);
    if (!set || set.size === 0) return false;
    for (const fn of [...set]) fn(...args);
    return true;
  }
}
```
