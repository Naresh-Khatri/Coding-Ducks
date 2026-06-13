import { deepClone } from "./deep-clone";
import { cases } from "./mc-test";

cases("deepClone", [
  {
    name: "deep-clones nested values",
    input: "{ a: 1, b: { c: [2, 3] } }",
    expected: { a: 1, b: { c: [2, 3] } },
    run: () => deepClone({ a: 1, b: { c: [2, 3] } }),
  },
  {
    name: "nested objects become new references",
    input: "clone.b !== original.b",
    expected: true,
    run: () => {
      const original = { b: { c: 1 } };
      const clone = deepClone(original);
      return clone.b !== original.b;
    },
  },
  {
    name: "mutating the clone leaves the original intact",
    input: "push to clone.b.c, then read original.b.c",
    expected: [2, 3],
    run: () => {
      const original = { b: { c: [2, 3] } };
      const clone = deepClone(original);
      clone.b.c.push(4);
      return original.b.c;
    },
  },
  {
    name: "clones Date instances",
    input: "deepClone({ d: new Date(0) })",
    expected: { sameTime: true, newReference: true },
    run: () => {
      const d = new Date(0);
      const clone = deepClone({ d });
      return { sameTime: clone.d.getTime() === 0, newReference: clone.d !== d };
    },
  },
  {
    name: "handles circular references",
    input: "an object whose .self points back to itself",
    expected: { selfReferential: true, isCopy: true },
    run: () => {
      interface Node {
        name: string;
        self?: Node;
      }
      const original: Node = { name: "x" };
      original.self = original;
      const clone = deepClone(original);
      return { selfReferential: clone.self === clone, isCopy: clone !== original };
    },
  },
]);
