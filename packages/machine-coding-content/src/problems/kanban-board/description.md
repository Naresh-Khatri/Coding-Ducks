# Kanban Board

Build a small Kanban board with three columns and movable cards.

## Requirements

- Three columns: **To Do**, **In Progress**, **Done** (each a labelled region).
- Each column has an input + **Add** button that appends a card to that column; empty input adds nothing.
- Each card has **Move left** / **Move right** buttons that move it to the adjacent column.
- A card in the first column can't move left, and one in the last column can't move right (those buttons are disabled).

Implement it in `src/App.tsx`. (Move buttons stand in for drag-and-drop, which is
a natural extension.)
