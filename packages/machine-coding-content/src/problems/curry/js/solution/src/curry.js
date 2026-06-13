/**
 * Return a curried version of `fn` that gathers args until it has `fn.length`
 * of them, then invokes `fn`.
 */
export function curry(fn) {
  const arity = fn.length;
  return function curried(...args) {
    if (args.length >= arity) {
      return fn(...args);
    }
    return (...more) => curried(...args, ...more);
  };
}
