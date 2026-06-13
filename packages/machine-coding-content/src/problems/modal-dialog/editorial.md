# Solution

Drive everything from one `open` boolean and render the overlay + dialog only
when open. Close on the backdrop's click, but `stopPropagation` on the inner
dialog so clicks inside don't bubble out to it. A `keydown` listener on
`document` handles Escape, added and removed with the modal's lifecycle.

```tsx
useEffect(() => {
  if (!open) return;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  };
  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
}, [open]);
```

A fully accessible version would also trap focus inside the dialog and restore it
to the trigger button on close.
