import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App";
import { cases } from "./mc-test";

const dialogOpen = () => screen.queryByRole("dialog") !== null;
const openModal = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Open" }));

cases("Modal Dialog", [
  {
    name: "is closed initially",
    input: "render the page",
    expected: false,
    run: () => {
      render(<App />);
      return dialogOpen();
    },
  },
  {
    name: "opens when Open is clicked",
    input: "click Open",
    expected: true,
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await openModal(user);
      return dialogOpen();
    },
  },
  {
    name: "closes via the Close button",
    input: "open, then click Close",
    expected: false,
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await openModal(user);
      await user.click(screen.getByRole("button", { name: "Close" }));
      return dialogOpen();
    },
  },
  {
    name: "closes when Escape is pressed",
    input: "open, then press Escape",
    expected: false,
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await openModal(user);
      await user.keyboard("{Escape}");
      return dialogOpen();
    },
  },
  {
    name: "closes when the backdrop is clicked",
    input: "open, then click the backdrop",
    expected: false,
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await openModal(user);
      await user.click(screen.getByTestId("backdrop"));
      return dialogOpen();
    },
  },
  {
    name: "stays open when the dialog body is clicked",
    input: "open, then click inside the dialog",
    expected: true,
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await openModal(user);
      await user.click(screen.getByText("Are you sure?"));
      return dialogOpen();
    },
  },
]);
