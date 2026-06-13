/**
 * Flatten a deeply nested array into a single flat array, preserving order.
 */
export function flatten(value: unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const item of value) {
    if (Array.isArray(item)) out.push(...flatten(item));
    else out.push(item);
  }
  return out;
}
