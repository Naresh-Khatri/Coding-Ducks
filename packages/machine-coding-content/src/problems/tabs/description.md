# Tabs

Build a tabbed interface: a row of tabs and a panel showing the active tab's
content.

## Requirements

- Render each tab as a button with `role="tab"`, inside a `role="tablist"`.
- Show the content of the active tab in a `role="tabpanel"`.
- The **first** tab is active on initial render.
- Clicking a tab makes it active: its content shows and its `aria-selected` becomes `true` (all others `false`).
- Only the active tab's content is shown at a time.

Implement it in `src/App.tsx`.
