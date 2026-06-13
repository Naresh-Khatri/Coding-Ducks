type AnyFn = (...args: never[]) => unknown;

/**
 * Return a curried version of `fn` that gathers args until it has `fn.length`
 * of them, then invokes `fn`.
 */
export function curry(fn: AnyFn): (...args: unknown[]) => unknown {
  // TODO: implement
  return () => undefined;
}
