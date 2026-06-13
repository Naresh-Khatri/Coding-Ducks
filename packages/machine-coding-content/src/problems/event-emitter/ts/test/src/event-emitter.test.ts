import { EventEmitter } from "./event-emitter";
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
