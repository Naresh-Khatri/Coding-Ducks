/**
 * Return a deep copy of `value`: nested objects/arrays cloned recursively,
 * `Date`s duplicated, and circular references handled.
 */
export function deepClone<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return new Date(value.getTime()) as T;

  const cached = seen.get(value);
  if (cached) return cached as T;

  if (Array.isArray(value)) {
    const copy: unknown[] = [];
    seen.set(value, copy);
    for (const item of value) copy.push(deepClone(item, seen));
    return copy as T;
  }

  const copy: Record<string, unknown> = {};
  seen.set(value, copy);
  for (const key of Object.keys(value)) {
    copy[key] = deepClone((value as Record<string, unknown>)[key], seen);
  }
  return copy as T;
}
