# Autocomplete

Build a typeahead that suggests matches from a fixed list as the user types.

## Requirements

- A text input (`role="textbox"`).
- As the user types, show suggestions from the list whose text **contains** the query (case-insensitive).
- With an **empty** query, show no suggestion list.
- When nothing matches, show a **No results** message.
- Clicking a suggestion fills the input with it and closes the list.

Implement it in `src/App.tsx`. (Filtering an in-memory list is enough — debouncing
a real request is a natural extension.)
