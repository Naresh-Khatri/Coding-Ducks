# Flatten Array

Implement `flatten(value)` which takes a deeply nested array and returns a new,
fully flattened array — every nested level collapsed into a single flat array,
left to right.

```ts
flatten([1, [2, [3, [4]], 5]]); // → [1, 2, 3, 4, 5]
```

## Requirements

- Flatten arrays of **arbitrary depth**.
- Preserve the original left-to-right order.
- Don't mutate the input.
- An already-flat array (or an empty array) comes back unchanged.

Open `src/flatten.ts` and implement the function. Run the tests when you're done.
