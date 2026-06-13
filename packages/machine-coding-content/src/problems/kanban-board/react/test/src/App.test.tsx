import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App";
import { cases } from "./mc-test";

const column = (name: string) => screen.getByRole("region", { name });
const cardsIn = (name: string) =>
  within(column(name))
    .queryAllByRole("listitem")
    .map((li) => li.querySelector("span")?.textContent ?? "");

const addCard = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string,
  text: string,
) => {
  const region = column(name);
  await user.type(within(region).getByRole("textbox"), text);
  await user.click(within(region).getByRole("button", { name: "Add" }));
};

cases("Kanban Board", [
  {
    name: "adds a card to a column",
    input: 'add "Write tests" to To Do',
    expected: ["Write tests"],
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await addCard(user, "To Do", "Write tests");
      return cardsIn("To Do");
    },
  },
  {
    name: "ignores an empty card",
    input: "click Add with an empty input",
    expected: [],
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      const region = column("To Do");
      await user.click(within(region).getByRole("button", { name: "Add" }));
      return cardsIn("To Do");
    },
  },
  {
    name: "moves a card to the next column",
    input: "add a card to To Do, then Move right",
    expected: { todo: [], inProgress: ["Ship it"] },
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await addCard(user, "To Do", "Ship it");
      await user.click(screen.getByRole("button", { name: "Move Ship it right" }));
      return { todo: cardsIn("To Do"), inProgress: cardsIn("In Progress") };
    },
  },
  {
    name: "disables Move left in the first column",
    input: "add a card to To Do",
    expected: true,
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await addCard(user, "To Do", "Task");
      const btn = screen.getByRole("button", {
        name: "Move Task left",
      }) as HTMLButtonElement;
      return btn.disabled;
    },
  },
  {
    name: "moves a card across to the last column",
    input: "add to To Do, Move right twice",
    expected: { done: ["Deploy"], canMoveRight: false },
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await addCard(user, "To Do", "Deploy");
      await user.click(screen.getByRole("button", { name: "Move Deploy right" }));
      await user.click(screen.getByRole("button", { name: "Move Deploy right" }));
      const right = screen.getByRole("button", {
        name: "Move Deploy right",
      }) as HTMLButtonElement;
      return { done: cardsIn("Done"), canMoveRight: !right.disabled };
    },
  },
]);
