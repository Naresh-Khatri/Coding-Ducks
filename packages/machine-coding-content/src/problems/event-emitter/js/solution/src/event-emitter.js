export class EventEmitter {
  listeners = new Map();

  on(name, fn) {
    const set = this.listeners.get(name) ?? new Set();
    set.add(fn);
    this.listeners.set(name, set);
    return this;
  }

  off(name, fn) {
    this.listeners.get(name)?.delete(fn);
    return this;
  }

  once(name, fn) {
    const wrapper = (...args) => {
      this.off(name, wrapper);
      fn(...args);
    };
    return this.on(name, wrapper);
  }

  emit(name, ...args) {
    const set = this.listeners.get(name);
    if (!set || set.size === 0) return false;
    for (const fn of [...set]) fn(...args);
    return true;
  }
}
