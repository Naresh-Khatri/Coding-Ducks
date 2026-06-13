import type { MachineCodingProblem } from "../types";

const DESCRIPTION = `# Modal Dialog

Build an accessible modal dialog.

## Requirements

- An **Open** button shows the dialog; it is **not** in the document until opened.
- The dialog has \`role="dialog"\` and \`aria-modal="true"\`.
- The dialog closes when: the **Close** button is clicked, **Escape** is pressed, or the **backdrop** (the area outside the dialog) is clicked.
- Clicking **inside** the dialog does not close it.

Implement it in \`src/App.tsx\`.
`;

const EDITORIAL = `# Solution

Drive everything from one \`open\` boolean and render the overlay + dialog only
when open. Close on the backdrop's click, but \`stopPropagation\` on the inner
dialog so clicks inside don't bubble out to it. A \`keydown\` listener on
\`document\` handles Escape, added and removed with the modal's lifecycle.

\`\`\`tsx
useEffect(() => {
  if (!open) return;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  };
  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
}, [open]);
\`\`\`

A fully accessible version would also trap focus inside the dialog and restore it
to the trigger button on close.
`;

export const modalDialog: MachineCodingProblem = {
  slug: "modal-dialog",
  title: "Modal Dialog",
  difficulty: "medium",
  category: "ui-component",
  durationMinutes: 30,
  tags: ["React", "Accessibility", "Events"],
  companies: ["Atlassian", "Stripe", "Airbnb"],
  templateId: "react-ts",
  displayOrder: 120,
  description: DESCRIPTION,
  editorial: EDITORIAL,
  starterFiles: {
    "src/App.tsx": `import { useState } from "react";

export default function App() {
  const [open, setOpen] = useState(false);

  // TODO:
  //  - show the dialog (role="dialog", aria-modal) only when open
  //  - close on the Close button, on Escape, and on a backdrop click
  //  - clicking inside the dialog must NOT close it
  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>Modal Dialog</h1>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
    </main>
  );
}
`,
  },
  solutionFiles: {
    "src/App.tsx": `import { useEffect, useState } from "react";

export default function App() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>Modal Dialog</h1>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      {open && (
        <div
          data-testid="backdrop"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              padding: "1.5rem",
              borderRadius: 8,
              minWidth: 240,
            }}
          >
            <p>Are you sure?</p>
            <button type="button" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
`,
  },
  testFiles: {
    "src/App.test.tsx": `import { render, screen } from "@testing-library/react";
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
`,
  },
};
