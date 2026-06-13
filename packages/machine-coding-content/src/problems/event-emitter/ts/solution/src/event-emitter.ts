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
