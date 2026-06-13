export class EventEmitter {
  on(name, fn) {
    // TODO: register the listener
    return this;
  }

  off(name, fn) {
    // TODO: remove the listener
    return this;
  }

  once(name, fn) {
    // TODO: register a one-shot listener
    return this;
  }

  emit(name, ...args) {
    // TODO: call the listeners; return whether any ran
    return false;
  }
}
