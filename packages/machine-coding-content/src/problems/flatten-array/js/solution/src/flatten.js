/**
 * Flatten a deeply nested array into a single flat array, preserving order.
 */
export function flatten(value) {
  const out = [];
  for (const item of value) {
    if (Array.isArray(item)) out.push(...flatten(item));
    else out.push(item);
  }
  return out;
}
