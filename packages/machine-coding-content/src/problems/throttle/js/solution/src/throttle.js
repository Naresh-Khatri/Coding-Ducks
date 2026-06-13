/**
 * Return a throttled version of `fn` that runs at most once per `wait` ms.
 */
export function throttle(fn, wait) {
  let cooling = false;
  return function (...args) {
    if (cooling) return;
    fn.apply(this, args);
    cooling = true;
    setTimeout(() => {
      cooling = false;
    }, wait);
  };
}
