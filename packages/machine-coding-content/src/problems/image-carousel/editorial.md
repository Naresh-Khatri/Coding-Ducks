# Solution

Keep just the current index. Wrapping in both directions falls out of modular
arithmetic — add the slide count before taking the remainder so a negative step
still lands in range.

```tsx
const go = (delta: number) =>
  setIndex((i) => (i + delta + SLIDES.length) % SLIDES.length);
```

Driving the view from a single index keeps the image, the counter, and (if you add
them) the dots all in sync automatically.
