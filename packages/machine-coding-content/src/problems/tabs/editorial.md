# Solution

Store just the active tab's id. The selected state and the visible panel are both
**derived** from it on render, so they can never drift apart.

```tsx
const [active, setActive] = useState(TABS[0].id);
const current = TABS.find((t) => t.id === active) ?? TABS[0];
```

Wiring `role`, `aria-selected`, and a single `tabpanel` gives you the ARIA tabs
pattern; a keyboard-complete version would also move focus with the arrow keys.
