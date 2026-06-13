# Nested Comments

Render a threaded comment tree where any comment can be replied to, nesting the
reply beneath it.

## Requirements

- Render the comment tree **recursively**, indenting replies under their parent.
- Each comment has a **Reply** button that toggles a reply input for that comment.
- Submitting a non-empty reply adds it as a child of that comment and closes the input.
- Empty (whitespace-only) replies are ignored.

Implement it in `src/App.tsx`.
