import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App";
import { cases } from "./mc-test";

const cell = (i: number) => screen.getByRole("button", { name: `Cell ${i}` });
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
