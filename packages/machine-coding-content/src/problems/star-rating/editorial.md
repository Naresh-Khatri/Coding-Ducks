# Solution

Track two pieces of state: the committed `rating` and a transient `hover`. The
stars fill up to `hover || rating`, so hovering previews without overwriting the
committed value, and clearing `hover` on mouse-leave restores the committed view.

```tsx
const [rating, setRating] = useState(0);
const [hover, setHover] = useState(0);
const active = hover || rating;
```

Each star is a real `<button>` (focusable, labelled) rather than a `<span>`, which
keeps the widget keyboard- and screen-reader-friendly.
