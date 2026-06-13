import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";

import App from "./App.vue";
import { cases } from "./mc-test";

const star = (n: number) => screen.getByRole("button", { name: "Rate " + n });
const marks = () => [1, 2, 3, 4, 5].map((n) => star(n).textContent?.trim() ?? "");
const filled = () => marks().filter((m) => m === "★").length;
const status = () => screen.getByRole("status").textContent?.trim() ?? "";

cases("Star Rating", [
  {
    name: "shows no rating initially",
    input: "render the widget",
    expected: { status: "No rating", filled: 0 },
    run: () => {
      render(App);
      return { status: status(), filled: filled() };
    },
  },
  {
    name: "clicking a star sets the rating",
    input: "click Rate 3",
    expected: "Rated: 3",
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.click(star(3));
      return status();
    },
  },
  {
    name: "fills stars up to the clicked one",
    input: "click Rate 3",
    expected: ["★", "★", "★", "☆", "☆"],
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.click(star(3));
      return marks();
    },
  },
  {
    name: "re-rating updates the value",
    input: "click Rate 4, then Rate 2",
    expected: { status: "Rated: 2", filled: 2 },
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.click(star(4));
      await user.click(star(2));
      return { status: status(), filled: filled() };
    },
  },
  {
    name: "hovering previews without committing",
    input: "hover Rate 4 (no click)",
    expected: { status: "No rating", filled: 4 },
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.hover(star(4));
      return { status: status(), filled: filled() };
    },
  },
]);
