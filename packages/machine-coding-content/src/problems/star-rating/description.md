# Star Rating

Build a 5-star rating widget.

## Requirements

- Render 5 star buttons, each with an accessible label `Rate N` (N = 1–5).
- A star shows filled (`★`) when its position is ≤ the current rating, otherwise empty (`☆`).
- Clicking star N sets the rating to N.
- **Hovering** star N previews a rating of N (stars fill up to it) without committing; moving the pointer away restores the committed rating.
- A `role="status"` element shows `Rated: N`, or `No rating` before anything is picked.

Implement it in `src/App.tsx`.
