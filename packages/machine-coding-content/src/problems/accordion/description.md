# Accordion

Build an accordion from a fixed list of sections. Each section has a header
button and a collapsible body.

## Requirements

- Render each section's title as a `<button>` whose `aria-expanded` reflects whether its body is open.
- Bodies start **collapsed** (not rendered).
- Clicking a header toggles only that section's body.
- Sections open and close **independently** — opening one doesn't close the others.

Implement it in `src/App.tsx`.
