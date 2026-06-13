import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";

import App from "./App.svelte";
import { cases } from "./mc-test";

// Body row names, in display order (skip the header row).
const names = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0]?.textContent?.trim() ?? "");
const status = () => screen.getByRole("status").textContent?.trim() ?? "";
const header = (name: string) => screen.getByRole("button", { name });
const nextPage = () => screen.getByRole("button", { name: "Next" });

cases("Data Table", [
  {
    name: "shows the first page of rows",
    input: "render the table",
    expected: { names: ["Carol", "Alice"], status: "Page 1 of 3" },
    run: () => {
      render(App);
      return { names: names(), status: status() };
    },
  },
  {
    name: "Next moves to the following page",
    input: "click Next",
    expected: { names: ["Dave", "Bob"], status: "Page 2 of 3" },
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.click(nextPage());
      return { names: names(), status: status() };
    },
  },
  {
    name: "sorts by name ascending",
    input: "click the Name header",
    expected: ["Alice", "Bob"],
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.click(header("Name"));
      return names();
    },
  },
  {
    name: "toggles to descending on a second click",
    input: "click the Name header twice",
    expected: ["Erin", "Dave"],
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.click(header("Name"));
      await user.click(header("Name"));
      return names();
    },
  },
  {
    name: "sorts by age",
    input: "click the Age header",
    expected: ["Dave", "Alice"],
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.click(header("Age"));
      return names();
    },
  },
]);
