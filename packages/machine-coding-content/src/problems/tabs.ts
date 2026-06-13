import type { MachineCodingProblem } from "../types";

const DESCRIPTION = `# Tabs

Build a tabbed interface: a row of tabs and a panel showing the active tab's
content.

## Requirements

- Render each tab as a button with \`role="tab"\`, inside a \`role="tablist"\`.
- Show the content of the active tab in a \`role="tabpanel"\`.
- The **first** tab is active on initial render.
- Clicking a tab makes it active: its content shows and its \`aria-selected\` becomes \`true\` (all others \`false\`).
- Only the active tab's content is shown at a time.

Implement it in \`src/App.tsx\`.
`;

const EDITORIAL = `# Solution

Store just the active tab's id. The selected state and the visible panel are both
**derived** from it on render, so they can never drift apart.

\`\`\`tsx
const [active, setActive] = useState(TABS[0].id);
const current = TABS.find((t) => t.id === active) ?? TABS[0];
\`\`\`

Wiring \`role\`, \`aria-selected\`, and a single \`tabpanel\` gives you the ARIA tabs
pattern; a keyboard-complete version would also move focus with the arrow keys.
`;

export const tabs: MachineCodingProblem = {
  slug: "tabs",
  title: "Tabs",
  difficulty: "easy",
  category: "ui-component",
  durationMinutes: 25,
  tags: ["React", "State", "Accessibility"],
  companies: ["Meta", "Microsoft", "Shopify"],
  templateId: "react-ts",
  displayOrder: 100,
  description: DESCRIPTION,
  editorial: EDITORIAL,
  starterFiles: {
    "src/App.tsx": `import { useState } from "react";

const TABS = [
  { id: "html", label: "HTML", content: "HyperText Markup Language" },
  { id: "css", label: "CSS", content: "Cascading Style Sheets" },
  { id: "js", label: "JS", content: "JavaScript, the language of the web" },
];

export default function App() {
  // TODO:
  //  - track the active tab id (default to the first)
  //  - render role="tab" buttons in a role="tablist", with aria-selected
  //  - show the active tab's content in a role="tabpanel"
  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>Tabs</h1>
      <div role="tablist" style={{ display: "flex", gap: 4 }}>
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={false}>
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" style={{ paddingTop: 8 }} />
    </main>
  );
}
`,
  },
  solutionFiles: {
    "src/App.tsx": `import { useState } from "react";

const TABS = [
  { id: "html", label: "HTML", content: "HyperText Markup Language" },
  { id: "css", label: "CSS", content: "Cascading Style Sheets" },
  { id: "js", label: "JS", content: "JavaScript, the language of the web" },
];

export default function App() {
  const [active, setActive] = useState(TABS[0].id);
  const current = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>Tabs</h1>
      <div role="tablist" style={{ display: "flex", gap: 4 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === active}
            onClick={() => setActive(t.id)}
            style={{
              padding: "6px 12px",
              border: "1px solid #ccc",
              borderBottom:
                t.id === active ? "2px solid #3178c6" : "1px solid #ccc",
              background: t.id === active ? "#eef4fb" : "#fff",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" style={{ paddingTop: 8 }}>
        {current.content}
      </div>
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

const tab = (name: string) => screen.getByRole("tab", { name });
const panel = () => screen.getByRole("tabpanel").textContent ?? "";
const selected = (name: string) => tab(name).getAttribute("aria-selected");

cases("Tabs", [
  {
    name: "shows the first tab by default",
    input: "render the tabs",
    expected: { panel: "HyperText Markup Language", selected: "true" },
    run: () => {
      render(<App />);
      return { panel: panel(), selected: selected("HTML") };
    },
  },
  {
    name: "clicking a tab switches the panel",
    input: "click CSS",
    expected: "Cascading Style Sheets",
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
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
      render(<App />);
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
      render(<App />);
      await user.click(tab("JS"));
      return {
        js: screen.queryByText("JavaScript, the language of the web") !== null,
        css: screen.queryByText("Cascading Style Sheets") !== null,
      };
    },
  },
]);
`,
  },
};
