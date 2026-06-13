import type { MachineCodingProblem } from "../types";

const DESCRIPTION = `# Event Emitter

Implement an \`EventEmitter\` class — a tiny publish/subscribe hub.

\`\`\`ts
const bus = new EventEmitter();
const onPing = (msg) => console.log("ping:", msg);
bus.on("ping", onPing);
bus.emit("ping", "hello"); // logs: ping: hello
bus.off("ping", onPing);
bus.emit("ping", "hi"); // nothing happens
\`\`\`

## Requirements

- \`on(name, fn)\` registers a listener for an event.
- \`off(name, fn)\` removes that exact listener.
- \`emit(name, ...args)\` calls every listener for \`name\`, in registration order, with \`args\`. Returns \`true\` if there were listeners, else \`false\`.
- \`once(name, fn)\` registers a listener that fires at most once.

Open \`src/event-emitter.ts\` and implement the class.
`;

const EDITORIAL = `# Solution

Keep a \`Map\` from event name to a \`Set\` of listeners (a \`Set\` makes \`off\` O(1)
and de-dupes registrations). \`once\` wraps the listener so it removes itself before
delegating. \`emit\` iterates a **copy** of the set so a listener that removes
itself mid-emit doesn't make the loop skip the next one.

\`\`\`ts
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
\`\`\`
`;

export const eventEmitter: MachineCodingProblem = {
  slug: "event-emitter",
  title: "Event Emitter",
  difficulty: "medium",
  category: "js-utility",
  durationMinutes: 30,
  tags: ["Classes", "Pub/Sub"],
  companies: ["Meta", "Amazon", "Netflix"],
  templateId: "vanilla-ts",
  displayOrder: 60,
  description: DESCRIPTION,
  editorial: EDITORIAL,
  starterFiles: {
    "src/event-emitter.ts": `type Listener = (...args: unknown[]) => void;

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
`,
    "src/main.ts": `import { EventEmitter } from "./event-emitter";

const log: string[] = [];
const bus = new EventEmitter();
bus.on("greet", (name) => log.push("hello " + String(name)));
bus.once("greet", () => log.push("(this listener fires once)"));
bus.emit("greet", "world");
bus.emit("greet", "again");

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = "<h1>Event Emitter</h1><pre>" + log.join("\\n") + "</pre>";
`,
  },
  solutionFiles: {
    "src/event-emitter.ts": `type Listener = (...args: unknown[]) => void;

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
`,
  },
  testFiles: {
    "src/event-emitter.test.ts": `import { EventEmitter } from "./event-emitter";
import { cases } from "./mc-test";

cases("EventEmitter", [
  {
    name: "calls a listener with the emitted args",
    input: 'on("x"); emit("x", 1, 2)',
    expected: [[1, 2]],
    run: () => {
      const bus = new EventEmitter();
      const got: unknown[] = [];
      bus.on("x", (a, b) => got.push([a, b]));
      bus.emit("x", 1, 2);
      return got;
    },
  },
  {
    name: "calls multiple listeners in registration order",
    input: "register a, then b; emit once",
    expected: ["a", "b"],
    run: () => {
      const bus = new EventEmitter();
      const order: string[] = [];
      bus.on("x", () => order.push("a"));
      bus.on("x", () => order.push("b"));
      bus.emit("x");
      return order;
    },
  },
  {
    name: "off removes a listener",
    input: "on then off the same fn; emit",
    expected: { calls: 0 },
    run: () => {
      const bus = new EventEmitter();
      let calls = 0;
      const fn = () => {
        calls++;
      };
      bus.on("x", fn);
      bus.off("x", fn);
      bus.emit("x");
      return { calls };
    },
  },
  {
    name: "once fires only the first time",
    input: "once; emit twice",
    expected: { calls: 1 },
    run: () => {
      const bus = new EventEmitter();
      let calls = 0;
      bus.once("x", () => {
        calls++;
      });
      bus.emit("x");
      bus.emit("x");
      return { calls };
    },
  },
  {
    name: "emit returns false when there are no listeners",
    input: 'emit("nope")',
    expected: false,
    run: () => new EventEmitter().emit("nope"),
  },
]);
`,
  },
};
