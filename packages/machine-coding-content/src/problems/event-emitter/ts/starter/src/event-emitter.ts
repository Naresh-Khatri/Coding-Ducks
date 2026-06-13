type Listener = (...args: unknown[]) => void;

export class EventEmitter {
  on(name: string, fn: Listener): this {
    // TODO: register the listener
    return this;
  }

  off(name: string, fn: Listener): this {
    // TODO: remove the listener
    return this;
  }

  once(name: string, fn: Listener): this {
    // TODO: register a one-shot listener
    return this;
  }

  emit(name: string, ...args: unknown[]): boolean {
    // TODO: call the listeners; return whether any ran
    return false;
  }
}
