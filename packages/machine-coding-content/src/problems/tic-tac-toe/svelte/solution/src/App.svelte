<script lang="ts">
  type Mark = "X" | "O" | null;

  const LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  function winnerOf(board: Mark[]): Mark {
    for (const [a, b, c] of LINES) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  }

  let board = $state<Mark[]>(Array(9).fill(null));
  let xIsNext = $state(true);

  const winner = $derived(winnerOf(board));
  const full = $derived(board.every(Boolean));
  const status = $derived(
    winner
      ? `Winner: ${winner}`
      : full
        ? "Draw"
        : `Next: ${xIsNext ? "X" : "O"}`,
  );

  function play(i: number) {
    if (board[i] || winner) return;
    const next = board.slice();
    next[i] = xIsNext ? "X" : "O";
    board = next;
    xIsNext = !xIsNext;
  }

  function reset() {
    board = Array(9).fill(null);
    xIsNext = true;
  }
</script>

<main style="font-family: sans-serif; padding: 1rem">
  <h1>Tic Tac Toe</h1>
  <p role="status">{status}</p>
  <div
    style="display: grid; grid-template-columns: repeat(3, 4rem); gap: 4px; margin-bottom: 1rem"
  >
    {#each board as cell, i (i)}
      <button
        type="button"
        aria-label={`Cell ${i}`}
        onclick={() => play(i)}
        style="height: 4rem; font-size: 1.5rem"
      >
        {cell}
      </button>
    {/each}
  </div>
  <button type="button" onclick={reset}>Reset</button>
</main>
