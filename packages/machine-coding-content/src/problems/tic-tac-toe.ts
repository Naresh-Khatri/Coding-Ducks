import type { MachineCodingProblem } from "../types";

const DESCRIPTION = `# Tic Tac Toe

Build a two-player tic-tac-toe game (X and O share the keyboard/mouse).

## Requirements

- A 3×3 board of cells. Each cell button has an accessible label \`Cell N\`
  where \`N\` is its index \`0\`–\`8\`.
- X moves first; turns alternate. A cell that's already taken can't be changed.
- A status element with \`role="status"\` shows:
  - \`Next: X\` / \`Next: O\` while playing,
  - \`Winner: X\` / \`Winner: O\` when someone wins,
  - \`Draw\` when the board fills with no winner.
- Once there's a winner, further clicks are ignored.
- A **Reset** button clears the board back to X's turn.

Implement it in \`src/App.tsx\`.
`;

const EDITORIAL = `# Solution

Model the board as a 9-element array of \`"X" | "O" | null\`. Derive the winner
and the status from the board on every render rather than storing them — derived
state can't drift.

\`\`\`tsx
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
\`\`\`

A click is a no-op when the cell is filled or the game is already won.
`;

export const ticTacToe: MachineCodingProblem = {
  slug: "tic-tac-toe",
  title: "Tic Tac Toe",
  difficulty: "medium",
  category: "small-app",
  durationMinutes: 45,
  tags: ["React", "State", "Game"],
  companies: ["Amazon", "Apple"],
  templateId: "react-ts",
  displayOrder: 40,
  description: DESCRIPTION,
  editorial: EDITORIAL,
  starterFiles: {
    "src/App.tsx": `import { useState } from "react";

export default function App() {
  // TODO: implement tic-tac-toe
  //  - 3x3 board; each cell button has aria-label \`Cell {index}\`
  //  - X first, alternate turns, no overwriting a taken cell
  //  - status element with role="status": "Next: X" | "Winner: X" | "Draw"
  //  - "Reset" button clears the board
  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>Tic Tac Toe</h1>
      <p role="status">Next: X</p>
      <div />
      <button type="button">Reset</button>
    </main>
  );
}
`,
  },
  solutionFiles: {
    "src/App.tsx": `import { useState } from "react";

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
    ? \`Winner: \${winner}\`
    : full
      ? "Draw"
      : \`Next: \${xIsNext ? "X" : "O"}\`;

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
            aria-label={\`Cell \${i}\`}
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
`,
  },
  testFiles: {
    "src/App.test.tsx": `import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App";
import { cases } from "./mc-test";

const cell = (i: number) => screen.getByRole("button", { name: \`Cell \${i}\` });
const mark = (i: number) => cell(i).textContent ?? "";
const status = () => screen.getByRole("status").textContent ?? "";

cases("Tic Tac Toe", [
  {
    name: "starts with X to move",
    input: "render the board",
    expected: "Next: X",
    run: () => {
      render(<App />);
      return status();
    },
  },
  {
    name: "alternates X and O",
    input: "X plays cell 0, then O plays cell 1",
    expected: { cell0: "X", cell1: "O", status: "Next: X" },
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(cell(0));
      await user.click(cell(1));
      return { cell0: mark(0), cell1: mark(1), status: status() };
    },
  },
  {
    name: "ignores a click on a taken cell",
    input: "X plays cell 0, then someone clicks cell 0 again",
    expected: { cell0: "X", status: "Next: O" },
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(cell(0));
      await user.click(cell(0));
      return { cell0: mark(0), status: status() };
    },
  },
  {
    name: "detects a winning row",
    input: "X: 0, 1, 2 — O: 3, 4 (X completes the top row)",
    expected: "Winner: X",
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(cell(0)); // X
      await user.click(cell(3)); // O
      await user.click(cell(1)); // X
      await user.click(cell(4)); // O
      await user.click(cell(2)); // X completes the top row
      return status();
    },
  },
  {
    name: "resets the board",
    input: "X plays cell 0, then click Reset",
    expected: { cell0: "", status: "Next: X" },
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(cell(0));
      await user.click(screen.getByRole("button", { name: /reset/i }));
      return { cell0: mark(0), status: status() };
    },
  },
]);
`,
  },
};
