import { useState } from "react";

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

export default function App() {
  const [board, setBoard] = useState<Mark[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const winner = winnerOf(board);
  const full = board.every(Boolean);
  const status = winner
    ? `Winner: ${winner}`
    : full
      ? "Draw"
      : `Next: ${xIsNext ? "X" : "O"}`;

  const play = (i: number) => {
    if (board[i] || winner) return;
    const next = board.slice();
    next[i] = xIsNext ? "X" : "O";
    setBoard(next);
    setXIsNext((v) => !v);
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  };

  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>Tic Tac Toe</h1>
      <p role="status">{status}</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 4rem)",
          gap: 4,
          marginBottom: "1rem",
        }}
      >
        {board.map((cell, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Cell ${i}`}
            onClick={() => play(i)}
            style={{ height: "4rem", fontSize: "1.5rem" }}
          >
            {cell}
          </button>
        ))}
      </div>
      <button type="button" onClick={reset}>
        Reset
      </button>
    </main>
  );
}
