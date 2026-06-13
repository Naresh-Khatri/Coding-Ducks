import type { MachineCodingProblem } from "../types";

const DESCRIPTION = `# Accordion

Build an accordion from a fixed list of sections. Each section has a header
button and a collapsible body.

## Requirements

- Render each section's title as a \`<button>\` whose \`aria-expanded\` reflects whether its body is open.
- Bodies start **collapsed** (not rendered).
- Clicking a header toggles only that section's body.
- Sections open and close **independently** — opening one doesn't close the others.

Implement it in \`src/App.tsx\`.
`;

const EDITORIAL = `# Solution

Hold the open/closed state as a map of section id → boolean and toggle one key at
a time, so each section is independent. Render a body only when its flag is set,
and mirror that flag in \`aria-expanded\` for accessibility.

\`\`\`tsx
const [open, setOpen] = useState<Record<string, boolean>>({});
const toggle = (id: string) =>
  setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
\`\`\`

For a single-open ("exclusive") accordion instead, store one \`openId\` string and
set it on click rather than toggling a map.
`;

export const accordion: MachineCodingProblem = {
  slug: "accordion",
  title: "Accordion",
  difficulty: "easy",
  category: "ui-component",
  durationMinutes: 25,
  tags: ["React", "State", "Accessibility"],
  companies: ["Microsoft", "Atlassian", "Google"],
  templateId: "react-ts",
  displayOrder: 90,
  description: DESCRIPTION,
  editorial: EDITORIAL,
  starterFiles: {
    "src/App.tsx": `import { useState } from "react";

const SECTIONS = [
  { id: "a", title: "Section A", body: "The body of section A." },
  { id: "b", title: "Section B", body: "The body of section B." },
  { id: "c", title: "Section C", body: "The body of section C." },
];

export default function App() {
  // TODO:
  //  - track which sections are open (they toggle independently)
  //  - each header is a button with aria-expanded reflecting its state
  //  - render a section's body only when it is open
  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem", maxWidth: 420 }}>
      <h1>Accordion</h1>
      {SECTIONS.map((s) => (
        <section key={s.id}>
          <h2 style={{ margin: 0 }}>
            <button type="button" aria-expanded={false}>
              {s.title}
            </button>
          </h2>
        </section>
      ))}
    </main>
  );
}
`,
  },
  solutionFiles: {
    "src/App.tsx": `import { useState } from "react";

const SECTIONS = [
  { id: "a", title: "Section A", body: "The body of section A." },
  { id: "b", title: "Section B", body: "The body of section B." },
  { id: "c", title: "Section C", body: "The body of section C." },
];

export default function App() {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (id: string) =>
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem", maxWidth: 420 }}>
      <h1>Accordion</h1>
      {SECTIONS.map((s) => {
        const isOpen = Boolean(open[s.id]);
        return (
          <section key={s.id} style={{ borderBottom: "1px solid #ddd" }}>
            <h2 style={{ margin: 0 }}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggle(s.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 4px",
                  background: "none",
                  border: "none",
                  font: "inherit",
                  cursor: "pointer",
                }}
              >
                {s.title}
              </button>
            </h2>
            {isOpen && <div style={{ padding: "4px 4px 12px" }}>{s.body}</div>}
          </section>
        );
      })}
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

const header = (title: string) => screen.getByRole("button", { name: title });
const bodyShown = (text: string) => screen.queryByText(text) !== null;

cases("Accordion", [
  {
    name: "starts with every body collapsed",
    input: "render the accordion",
    expected: { a: false, b: false, c: false },
    run: () => {
      render(<App />);
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
      render(<App />);
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
      render(<App />);
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
      render(<App />);
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
      render(<App />);
      await user.click(header("Section A"));
      return header("Section A").getAttribute("aria-expanded");
    },
  },
]);
`,
  },
};
