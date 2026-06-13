import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";

import App from "./App.svelte";
import { cases } from "./mc-test";

const box = () => screen.getByRole("textbox");
const options = () =>
  screen.queryAllByRole("option").map((o) => o.textContent?.trim() ?? "");
const listShown = () => screen.queryByRole("listbox") !== null;

cases("Autocomplete", [
  {
    name: "shows no list before typing",
    input: "render the widget",
    expected: false,
    run: () => {
      render(App);
      return listShown();
    },
  },
  {
    name: "filters as you type",
    input: 'type "an"',
    expected: ["Banana", "Mango", "Orange"],
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.type(box(), "an");
      return options();
    },
  },
  {
    name: "matching is case-insensitive",
    input: 'type "BAN"',
    expected: ["Banana"],
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.type(box(), "BAN");
      return options();
    },
  },
  {
    name: "shows No results when nothing matches",
    input: 'type "xyz"',
    expected: "No results",
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.type(box(), "xyz");
      return screen.getByRole("listbox").textContent?.trim() ?? "";
    },
  },
  {
    name: "picking a suggestion fills the input and closes the list",
    input: 'type "ban", click Banana',
    expected: { value: "Banana", listShown: false },
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.type(box(), "ban");
      await user.click(screen.getByRole("option", { name: "Banana" }));
      return {
        value: (box() as HTMLInputElement).value,
        listShown: listShown(),
      };
    },
  },
]);
