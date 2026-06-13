type AnyFn = (...args: never[]) => unknown;

/**
 * Return a curried version of `fn` that gathers args until it has `fn.length`
 * of them, then invokes `fn`.
 */
export function curry(fn: AnyFn): (...args: unknown[]) => unknown {
  const arity = fn.length;
  return function curried(...args: unknown[]): unknown {
    if (args.length >= arity) {
      return (fn as (...a: unknown[]) => unknown)(...args);
    }
    return (...more: unknown[]) => curried(...args, ...more);
  };
}
