import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";

import App from "./App.svelte";
import { cases } from "./mc-test";

const tab = (name: string) => screen.getByRole("tab", { name });
const panel = () => screen.getByRole("tabpanel").textContent?.trim() ?? "";
const selected = (name: string) => tab(name).getAttribute("aria-selected");

cases("Tabs", [
  {
    name: "shows the first tab by default",
    input: "render the tabs",
    expected: { panel: "HyperText Markup Language", selected: "true" },
    run: () => {
      render(App);
      return { panel: panel(), selected: selected("HTML") };
    },
  },
  {
    name: "clicking a tab switches the panel",
    input: "click CSS",
    expected: "Cascading Style Sheets",
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.click(tab("CSS"));
      return panel();
    },
  },
  {
    name: "marks the clicked tab as selected",
    input: "click CSS, read aria-selected of CSS and HTML",
    expected: { css: "true", html: "false" },
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.click(tab("CSS"));
      return { css: selected("CSS"), html: selected("HTML") };
    },
  },
  {
    name: "shows one panel's content at a time",
    input: "click JS, check the CSS content is gone",
    expected: { js: true, css: false },
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.click(tab("JS"));
      return {
        js: screen.queryByText("JavaScript, the language of the web") !== null,
        css: screen.queryByText("Cascading Style Sheets") !== null,
      };
    },
  },
]);
