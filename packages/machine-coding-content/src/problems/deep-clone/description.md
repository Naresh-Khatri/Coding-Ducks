# Deep Clone

Implement `deepClone(value)` that returns a deep copy of `value`. Nested objects
and arrays are cloned recursively, so mutating the copy never affects the
original.

```ts
const original = { a: 1, nested: { b: 2 } };
const copy = deepClone(original);
copy.nested.b = 99;
original.nested.b; // still 2
```

## Requirements

- Primitives are returned as-is.
- Plain objects and arrays are cloned recursively — no shared references.
- `Date` values are cloned to a fresh `Date`.
- Handle **circular references** without infinite recursion.
- Never mutate the input.

Open `src/deep-clone.ts` and implement the function.
