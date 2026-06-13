import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App";
import { cases } from "./mc-test";

// The visible todo labels, in order (each <li> has a <span> label).
const labels = () =>
  screen
    .queryAllByRole("listitem")
    .map((li) => li.querySelector("span")?.textContent ?? "");

const addBtn = () => screen.getByRole("button", { name: /^add$/i });

cases("Todo List", [
  {
    name: "adds a todo",
    input: 'type "Buy milk", click Add',
    expected: ["Buy milk"],
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.type(screen.getByRole("textbox"), "Buy milk");
      await user.click(addBtn());
      return labels();
    },
  },
  {
    name: "adds multiple todos",
    input: 'add "First", then add "Second"',
    expected: ["First", "Second"],
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.type(screen.getByRole("textbox"), "First");
      await user.click(addBtn());
      await user.type(screen.getByRole("textbox"), "Second");
      await user.click(addBtn());
      return labels();
    },
  },
  {
    name: "ignores empty input",
    input: "click Add with the input empty",
    expected: [],
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(addBtn());
      return labels();
    },
  },
  {
    name: "clears the input after adding",
    input: 'type "Something", click Add, then read the input value',
    expected: "",
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      const input = screen.getByRole("textbox");
      await user.type(input, "Something");
      await user.click(addBtn());
      return (input as HTMLInputElement).value;
    },
  },
  {
    name: "deletes a single todo",
    input: 'add "Temp", then click its Delete button',
    expected: [],
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.type(screen.getByRole("textbox"), "Temp");
      await user.click(addBtn());
      const item = screen.getByRole("listitem");
      await user.click(within(item).getByRole("button", { name: /delete/i }));
      return labels();
    },
  },
]);
