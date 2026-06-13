import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";

import App from "./App.svelte";
import { cases } from "./mc-test";

const header = (title: string) => screen.getByRole("button", { name: title });
const bodyShown = (text: string) => screen.queryByText(text) !== null;

cases("Accordion", [
  {
    name: "starts with every body collapsed",
    input: "render the accordion",
    expected: { a: false, b: false, c: false },
    run: () => {
      render(App);
      return {
        a: bodyShown("The body of section A."),
        b: bodyShown("The body of section B."),
        c: bodyShown("The body of section C."),
      };
    },
  },
  {
    name: "clicking a header opens its body",
    input: "click Section A",
    expected: true,
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.click(header("Section A"));
      return bodyShown("The body of section A.");
    },
  },
  {
    name: "clicking again collapses it",
    input: "click Section A twice",
    expected: false,
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.click(header("Section A"));
      await user.click(header("Section A"));
      return bodyShown("The body of section A.");
    },
  },
  {
    name: "sections open independently",
    input: "open A and B, leave C closed",
    expected: { a: true, b: true, c: false },
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.click(header("Section A"));
      await user.click(header("Section B"));
      return {
        a: bodyShown("The body of section A."),
        b: bodyShown("The body of section B."),
        c: bodyShown("The body of section C."),
      };
    },
  },
  {
    name: "reflects state via aria-expanded",
    input: "open Section A, read aria-expanded",
    expected: "true",
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.click(header("Section A"));
      return header("Section A").getAttribute("aria-expanded");
    },
  },
]);
