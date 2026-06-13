<script lang="ts">
  // TODO: implement tic-tac-toe
  //  - 3x3 board; each cell button has aria-label `Cell {index}`
  //  - X first, alternate turns, no overwriting a taken cell
  //  - status element with role="status": "Next: X" | "Winner: X" | "Draw"
  //  - "Reset" button clears the board
</script>

<main style="font-family: sans-serif; padding: 1rem">
  <h1>Tic Tac Toe</h1>
  <p role="status">Next: X</p>
  <div></div>
  <button type="button">Reset</button>
</main>
