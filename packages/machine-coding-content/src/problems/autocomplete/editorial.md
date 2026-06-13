# Solution

Derive the matches from the query on each render — there's no separate results
state to keep in sync. Track an `open` flag so picking a suggestion (or clearing
the input) can hide the list.

```tsx
const matches = query
  ? FRUITS.filter((f) => f.toLowerCase().includes(query.toLowerCase()))
  : [];
```

For a network-backed version you'd debounce the query, cancel stale requests, and
handle loading/error states — but the filtering and selection logic stays the same.
