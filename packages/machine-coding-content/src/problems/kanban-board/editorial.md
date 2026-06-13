# Solution

Keep one flat list of cards, each tagging which column index it's in. Columns are
just a filtered view of that list, and moving a card is a clamped change to its
column index — no per-column arrays to keep in sync.

```tsx
const move = (id: string, delta: number) =>
  setCards((cards) =>
    cards.map((card) =>
      card.id === id
        ? {
            ...card,
            col: Math.max(0, Math.min(COLUMNS.length - 1, card.col + delta)),
          }
        : card,
    ),
  );
```

A flat list also makes the move buttons trivial to disable at the ends and would
map cleanly onto a drag-and-drop library later.
