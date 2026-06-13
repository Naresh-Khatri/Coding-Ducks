import type { MachineCodingProblem } from "../types";

const DESCRIPTION = `# Kanban Board

Build a small Kanban board with three columns and movable cards.

## Requirements

- Three columns: **To Do**, **In Progress**, **Done** (each a labelled region).
- Each column has an input + **Add** button that appends a card to that column; empty input adds nothing.
- Each card has **Move left** / **Move right** buttons that move it to the adjacent column.
- A card in the first column can't move left, and one in the last column can't move right (those buttons are disabled).

Implement it in \`src/App.tsx\`. (Move buttons stand in for drag-and-drop, which is
a natural extension.)
`;

const EDITORIAL = `# Solution

Keep one flat list of cards, each tagging which column index it's in. Columns are
just a filtered view of that list, and moving a card is a clamped change to its
column index — no per-column arrays to keep in sync.

\`\`\`tsx
const move = (id: string, delta: number) =>
  setCards((cards) =>
    cards.map((card) =>
      card.id === id
        ? {
            ...card,
            col: Math.max(0, Math.min(COLUMNS.length - 1, card.col + delta)),
          }
        : card,
    ),
  );
\`\`\`

A flat list also makes the move buttons trivial to disable at the ends and would
map cleanly onto a drag-and-drop library later.
`;

export const kanbanBoard: MachineCodingProblem = {
  slug: "kanban-board",
  title: "Kanban Board",
  difficulty: "hard",
  category: "ui-component",
  durationMinutes: 60,
  tags: ["React", "State", "Lists"],
  companies: ["Atlassian", "Linear", "Trello"],
  templateId: "react-ts",
  displayOrder: 180,
  description: DESCRIPTION,
  editorial: EDITORIAL,
  starterFiles: {
    "src/App.tsx": `import { useState } from "react";

const COLUMNS = ["To Do", "In Progress", "Done"];

interface Card {
  id: string;
  text: string;
  col: number;
}

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);

  // TODO:
  //  - each column (a labelled region) has an input + Add button
  //  - Add appends a card to that column; ignore empty input
  //  - each card has Move left / Move right buttons (disabled at the ends)
  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>Kanban Board</h1>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {COLUMNS.map((name) => (
          <section key={name} aria-label={name} style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1rem" }}>{name}</h2>
          </section>
        ))}
      </div>
    </main>
  );
}
`,
  },
  solutionFiles: {
    "src/App.tsx": `import { useState } from "react";

const COLUMNS = ["To Do", "In Progress", "Done"];

interface Card {
  id: string;
  text: string;
  col: number;
}

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [drafts, setDrafts] = useState<string[]>(() => COLUMNS.map(() => ""));

  const setDraft = (col: number, value: string) =>
    setDrafts((d) => d.map((v, i) => (i === col ? value : v)));

  const add = (col: number) => {
    const text = drafts[col].trim();
    if (!text) return;
    setCards((c) => [...c, { id: crypto.randomUUID(), text, col }]);
    setDraft(col, "");
  };

  const move = (id: string, delta: number) =>
    setCards((c) =>
      c.map((card) =>
        card.id === id
          ? {
              ...card,
              col: Math.max(0, Math.min(COLUMNS.length - 1, card.col + delta)),
            }
          : card,
      ),
    );

  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>Kanban Board</h1>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {COLUMNS.map((name, col) => (
          <section
            key={name}
            aria-label={name}
            style={{
              flex: 1,
              background: "#f3f4f6",
              padding: 8,
              borderRadius: 8,
            }}
          >
            <h2 style={{ fontSize: "1rem", marginTop: 0 }}>{name}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                add(col);
              }}
              style={{ display: "flex", gap: 4 }}
            >
              <input
                aria-label={"Add to " + name}
                value={drafts[col]}
                onChange={(e) => setDraft(col, e.target.value)}
                style={{ width: "100%", minWidth: 0 }}
              />
              <button type="submit">Add</button>
            </form>
            <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
              {cards
                .filter((c) => c.col === col)
                .map((card) => (
                  <li
                    key={card.id}
                    style={{
                      background: "#fff",
                      padding: 6,
                      marginTop: 6,
                      borderRadius: 6,
                    }}
                  >
                    <span>{card.text}</span>
                    <div style={{ marginTop: 4, display: "flex", gap: 4 }}>
                      <button
                        type="button"
                        aria-label={"Move " + card.text + " left"}
                        disabled={card.col === 0}
                        onClick={() => move(card.id, -1)}
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        aria-label={"Move " + card.text + " right"}
                        disabled={card.col === COLUMNS.length - 1}
                        onClick={() => move(card.id, 1)}
                      >
                        ▶
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
`,
  },
  testFiles: {
    "src/App.test.tsx": `import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App";
import { cases } from "./mc-test";

const column = (name: string) => screen.getByRole("region", { name });
const cardsIn = (name: string) =>
  within(column(name))
    .queryAllByRole("listitem")
    .map((li) => li.querySelector("span")?.textContent ?? "");

const addCard = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string,
  text: string,
) => {
  const region = column(name);
  await user.type(within(region).getByRole("textbox"), text);
  await user.click(within(region).getByRole("button", { name: "Add" }));
};

cases("Kanban Board", [
  {
    name: "adds a card to a column",
    input: 'add "Write tests" to To Do',
    expected: ["Write tests"],
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await addCard(user, "To Do", "Write tests");
      return cardsIn("To Do");
    },
  },
  {
    name: "ignores an empty card",
    input: "click Add with an empty input",
    expected: [],
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      const region = column("To Do");
      await user.click(within(region).getByRole("button", { name: "Add" }));
      return cardsIn("To Do");
    },
  },
  {
    name: "moves a card to the next column",
    input: "add a card to To Do, then Move right",
    expected: { todo: [], inProgress: ["Ship it"] },
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await addCard(user, "To Do", "Ship it");
      await user.click(screen.getByRole("button", { name: "Move Ship it right" }));
      return { todo: cardsIn("To Do"), inProgress: cardsIn("In Progress") };
    },
  },
  {
    name: "disables Move left in the first column",
    input: "add a card to To Do",
    expected: true,
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await addCard(user, "To Do", "Task");
      const btn = screen.getByRole("button", {
        name: "Move Task left",
      }) as HTMLButtonElement;
      return btn.disabled;
    },
  },
  {
    name: "moves a card across to the last column",
    input: "add to To Do, Move right twice",
    expected: { done: ["Deploy"], canMoveRight: false },
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await addCard(user, "To Do", "Deploy");
      await user.click(screen.getByRole("button", { name: "Move Deploy right" }));
      await user.click(screen.getByRole("button", { name: "Move Deploy right" }));
      const right = screen.getByRole("button", {
        name: "Move Deploy right",
      }) as HTMLButtonElement;
      return { done: cardsIn("Done"), canMoveRight: !right.disabled };
    },
  },
]);
`,
  },
};
