import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";

import App from "./App.svelte";
import { cases } from "./mc-test";

const replyButton = (text: string) =>
  screen.getByRole("button", { name: "Reply to " + text });
const present = (text: string) => screen.queryByText(text) !== null;
const itemCount = () => screen.queryAllByRole("listitem").length;

cases("Nested Comments", [
  {
    name: "renders the initial comments",
    input: "render the tree",
    expected: { first: true, nested: true, second: true },
    run: () => {
      render(App);
      return {
        first: present("First comment"),
        nested: present("A reply to the first"),
        second: present("Second comment"),
      };
    },
  },
  {
    name: "shows a reply box when Reply is clicked",
    input: "click Reply on the first comment",
    expected: true,
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.click(replyButton("First comment"));
      return (
        screen.queryByRole("textbox", { name: "Reply to First comment" }) !==
        null
      );
    },
  },
  {
    name: "adds a reply under a comment",
    input: 'reply "Nice one" to the second comment',
    expected: true,
    run: async () => {
      const user = userEvent.setup();
      render(App);
      await user.click(replyButton("Second comment"));
      await user.type(
        screen.getByRole("textbox", { name: "Reply to Second comment" }),
        "Nice one",
      );
      await user.click(screen.getByRole("button", { name: "Add" }));
      return present("Nice one");
    },
  },
  {
    name: "ignores an empty reply",
    input: "open a reply box and submit it empty",
    expected: true,
    run: async () => {
      const user = userEvent.setup();
      render(App);
      const before = itemCount();
      await user.click(replyButton("First comment"));
      await user.click(screen.getByRole("button", { name: "Add" }));
      return itemCount() === before;
    },
  },
]);
