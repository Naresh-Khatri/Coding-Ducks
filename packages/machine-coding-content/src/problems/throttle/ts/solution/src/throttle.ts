/**
 * Return a throttled version of `fn` that runs at most once per `wait` ms.
 */
export function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
): (...args: A) => void {
  let cooling = false;
  return function (this: unknown, ...args: A) {
    if (cooling) return;
    fn.apply(this, args);
    cooling = true;
    setTimeout(() => {
      cooling = false;
    }, wait);
  };
}
