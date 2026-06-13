# Solution

Walk the array; when an element is itself an array, recurse and spread its
flattened result into the output, otherwise push the value.

```ts
export function flatten(value: unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const item of value) {
    if (Array.isArray(item)) out.push(...flatten(item));
    else out.push(item);
  }
  return out;
}
```

**Complexity:** O(n) in the total number of elements. For very deep arrays an
iterative stack-based version avoids blowing the call stack, but recursion reads
clearest in an interview.
