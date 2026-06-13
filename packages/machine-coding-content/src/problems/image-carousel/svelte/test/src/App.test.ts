import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";

import App from "./App.svelte";
import { cases } from "./mc-test";

const current = () => screen.getByRole("img").getAttribute("alt") ?? "";
const status = () => screen.getByRole("status").textContent?.trim() ?? "";
const next = () => screen.getByRole("button", { name: "Next slide" });
const prev = () => screen.getByRole("button", { name: "Previous slide" });

cases("Image Carousel", [
  {
    name: "shows the first slide",
    input: "render the carousel",
    expected: { alt: "Mountains", status: "Slide 1 of 3" },
    run: () => {
      render(App);
      return { alt: current(), status: status() };
    },
  },
  {
    name: "Next advances to the following slide",
    input: "click Next",
    expected: { alt: "Beach", status: "Slide 2 of 3" },
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.click(next());
      return { alt: current(), status: status() };
    },
  },
  {
    name: "Previous goes back",
    input: "Next, then Previous",
    expected: "Mountains",
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.click(next());
      await user.click(prev());
      return current();
    },
  },
  {
    name: "wraps from the last slide to the first",
    input: "click Next three times",
    expected: { alt: "Mountains", status: "Slide 1 of 3" },
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.click(next());
      await user.click(next());
      await user.click(next());
      return { alt: current(), status: status() };
    },
  },
  {
    name: "wraps from the first slide to the last with Previous",
    input: "click Previous once",
    expected: { alt: "Forest", status: "Slide 3 of 3" },
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.click(prev());
      return { alt: current(), status: status() };
    },
  },
]);
