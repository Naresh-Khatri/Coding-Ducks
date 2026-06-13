import type { MachineCodingProblem } from "../types";

const DESCRIPTION = `# Autocomplete

Build a typeahead that suggests matches from a fixed list as the user types.

## Requirements

- A text input (\`role="textbox"\`).
- As the user types, show suggestions from the list whose text **contains** the query (case-insensitive).
- With an **empty** query, show no suggestion list.
- When nothing matches, show a **No results** message.
- Clicking a suggestion fills the input with it and closes the list.

Implement it in \`src/App.tsx\`. (Filtering an in-memory list is enough — debouncing
a real request is a natural extension.)
`;

const EDITORIAL = `# Solution

Derive the matches from the query on each render — there's no separate results
state to keep in sync. Track an \`open\` flag so picking a suggestion (or clearing
the input) can hide the list.

\`\`\`tsx
const matches = query
  ? FRUITS.filter((f) => f.toLowerCase().includes(query.toLowerCase()))
  : [];
\`\`\`

For a network-backed version you'd debounce the query, cancel stale requests, and
handle loading/error states — but the filtering and selection logic stays the same.
`;

export const autocomplete: MachineCodingProblem = {
  slug: "autocomplete",
  title: "Autocomplete",
  difficulty: "medium",
  category: "ui-component",
  durationMinutes: 35,
  tags: ["React", "State", "Lists"],
  companies: ["Google", "Meta", "LinkedIn"],
  templateId: "react-ts",
  displayOrder: 130,
  description: DESCRIPTION,
  editorial: EDITORIAL,
  starterFiles: {
    "src/App.tsx": `import { useState } from "react";

const FRUITS = [
  "Apple",
  "Apricot",
  "Banana",
  "Blueberry",
  "Cherry",
  "Grape",
  "Mango",
  "Orange",
  "Peach",
  "Pear",
];

export default function App() {
  const [query, setQuery] = useState("");

  // TODO:
  //  - filter FRUITS by case-insensitive substring of the query
  //  - render the matches in a role="listbox"; hide it when the query is empty
  //  - show "No results" when nothing matches
  //  - clicking a suggestion fills the input and closes the list
  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem", maxWidth: 320 }}>
      <h1>Autocomplete</h1>
      <input
        aria-label="Search fruit"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type a fruit…"
      />
    </main>
  );
}
`,
  },
  solutionFiles: {
    "src/App.tsx": `import { useState } from "react";

const FRUITS = [
  "Apple",
  "Apricot",
  "Banana",
  "Blueberry",
  "Cherry",
  "Grape",
  "Mango",
  "Orange",
  "Peach",
  "Pear",
];

export default function App() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = query
    ? FRUITS.filter((f) => f.toLowerCase().includes(query.toLowerCase()))
    : [];

  const pick = (value: string) => {
    setQuery(value);
    setOpen(false);
  };

  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem", maxWidth: 320 }}>
      <h1>Autocomplete</h1>
      <input
        aria-label="Search fruit"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        placeholder="Type a fruit…"
      />
      {open && query && (
        <ul
          role="listbox"
          style={{
            listStyle: "none",
            padding: 0,
            margin: "4px 0",
            border: "1px solid #ddd",
          }}
        >
          {matches.length === 0 ? (
            <li style={{ padding: "4px 8px", color: "#888" }}>No results</li>
          ) : (
            matches.map((m) => (
              <li key={m}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => pick(m)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "4px 8px",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                  }}
                >
                  {m}
                </button>
              </li>
            ))
          )}
        </ul>
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

const box = () => screen.getByRole("textbox");
const options = () =>
  screen.queryAllByRole("option").map((o) => o.textContent ?? "");
const listShown = () => screen.queryByRole("listbox") !== null;

cases("Autocomplete", [
  {
    name: "shows no list before typing",
    input: "render the widget",
    expected: false,
    run: () => {
      render(<App />);
      return listShown();
    },
  },
  {
    name: "filters as you type",
    input: 'type "an"',
    expected: ["Banana", "Mango", "Orange"],
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.type(box(), "an");
      return options();
    },
  },
  {
    name: "matching is case-insensitive",
    input: 'type "BAN"',
    expected: ["Banana"],
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.type(box(), "BAN");
      return options();
    },
  },
  {
    name: "shows No results when nothing matches",
    input: 'type "xyz"',
    expected: "No results",
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.type(box(), "xyz");
      return screen.getByRole("listbox").textContent ?? "";
    },
  },
  {
    name: "picking a suggestion fills the input and closes the list",
    input: 'type "ban", click Banana',
    expected: { value: "Banana", listShown: false },
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.type(box(), "ban");
      await user.click(screen.getByRole("option", { name: "Banana" }));
      return {
        value: (box() as HTMLInputElement).value,
        listShown: listShown(),
      };
    },
  },
]);
`,
  },
};
