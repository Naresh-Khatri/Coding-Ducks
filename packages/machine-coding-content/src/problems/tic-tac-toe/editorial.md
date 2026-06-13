# Solution

Model the board as a 9-element array of `"X" | "O" | null`. Derive the winner
and the status from the board on every render rather than storing them — derived
state can't drift.

```tsx
const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];
function winnerOf(b) {
  for (const [a,c,d] of LINES)
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return null;
}
```

A click is a no-op when the cell is filled or the game is already won.
