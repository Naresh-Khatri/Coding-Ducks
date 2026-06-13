# Tic Tac Toe

Build a two-player tic-tac-toe game (X and O share the keyboard/mouse).

## Requirements

- A 3×3 board of cells. Each cell button has an accessible label `Cell N`
  where `N` is its index `0`–`8`.
- X moves first; turns alternate. A cell that's already taken can't be changed.
- A status element with `role="status"` shows:
  - `Next: X` / `Next: O` while playing,
  - `Winner: X` / `Winner: O` when someone wins,
  - `Draw` when the board fills with no winner.
- Once there's a winner, further clicks are ignored.
- A **Reset** button clears the board back to X's turn.

Implement it in `src/App.tsx`.
