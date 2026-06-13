/**
 * Return a debounced version of `fn` that only runs `wait` ms after the
 * last call.
 */
export function debounce(fn, wait) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}
