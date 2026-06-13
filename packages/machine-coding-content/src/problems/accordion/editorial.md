# Solution

Hold the open/closed state as a map of section id → boolean and toggle one key at
a time, so each section is independent. Render a body only when its flag is set,
and mirror that flag in `aria-expanded` for accessibility.

```tsx
const [open, setOpen] = useState<Record<string, boolean>>({});
const toggle = (id: string) =>
  setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
```

For a single-open ("exclusive") accordion instead, store one `openId` string and
set it on click rather than toggling a map.
