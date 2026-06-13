import type { MachineCodingProblem } from "../types";

const DESCRIPTION = `# Todo List

Build a classic todo list in React.

## Requirements

- A text input and an **Add** button (the input is also submittable with Enter).
- Adding appends the trimmed text as a new item in a list.
- **Empty / whitespace-only** input must not add an item.
- Each item has a **Delete** button that removes just that item.

The starter renders the static shell — wire up the state and handlers in
\`src/App.tsx\`.

> Tip: the tests query by accessible role — a single text \`textbox\`, an
> \`Add\` button, \`listitem\`s, and a \`Delete\` button inside each item.
`;

const EDITORIAL = `# Solution

Hold the list and the draft text in state. On submit, trim the draft, bail if
empty, append an item with a stable id, and clear the input. Delete filters by
id.

\`\`\`tsx
const [todos, setTodos] = useState([]);
const [text, setText] = useState("");

const add = (e) => {
  e.preventDefault();
  const value = text.trim();
  if (!value) return;
  setTodos((prev) => [...prev, { id: crypto.randomUUID(), text: value }]);
  setText("");
};
\`\`\`

Using a \`<form>\` with \`onSubmit\` gives you Enter-to-add for free and keeps
the button as a \`submit\`.
`;

export const todoList: MachineCodingProblem = {
  slug: "todo-list",
  title: "Todo List",
  difficulty: "easy",
  category: "ui-component",
  durationMinutes: 30,
  tags: ["React", "State", "Forms"],
  companies: ["Meta", "Microsoft"],
  templateId: "react-ts",
  displayOrder: 110,
  description: DESCRIPTION,
  editorial: EDITORIAL,
  starterFiles: {
    "src/App.tsx": `import { useState } from "react";

export default function App() {
  // TODO:
  //  - track the list of todos and the input text in state
  //  - "Add" (or Enter) appends the trimmed text; ignore empty input
  //  - each item has a "Delete" button that removes only that item
  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem", maxWidth: 420 }}>
      <h1>Todo List</h1>
      <form>
        <input aria-label="New todo" placeholder="Add a todo" />
        <button type="submit">Add</button>
      </form>
      <ul></ul>
    </main>
  );
}
`,
  },
  solutionFiles: {
    "src/App.tsx": `import { useState } from "react";

interface Todo {
  id: string;
  text: string;
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setTodos((prev) => [...prev, { id: crypto.randomUUID(), text: value }]);
    setText("");
  };

  const remove = (id: string) =>
    setTodos((prev) => prev.filter((t) => t.id !== id));

  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem", maxWidth: 420 }}>
      <h1>Todo List</h1>
      <form onSubmit={add} style={{ display: "flex", gap: 8 }}>
        <input
          aria-label="New todo"
          placeholder="Add a todo"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit">Add</button>
      </form>
      <ul>
        {todos.map((t) => (
          <li
            key={t.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              padding: "4px 0",
            }}
          >
            <span>{t.text}</span>
            <button type="button" onClick={() => remove(t.id)}>
              Delete {t.text}
            </button>
          </li>
        ))}
      </ul>
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

// The visible todo labels, in order (each <li> has a <span> label).
const labels = () =>
  screen
    .queryAllByRole("listitem")
    .map((li) => li.querySelector("span")?.textContent ?? "");

const addBtn = () => screen.getByRole("button", { name: /^add$/i });

cases("Todo List", [
  {
    name: "adds a todo",
    input: 'type "Buy milk", click Add',
    expected: ["Buy milk"],
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.type(screen.getByRole("textbox"), "Buy milk");
      await user.click(addBtn());
      return labels();
    },
  },
  {
    name: "adds multiple todos",
    input: 'add "First", then add "Second"',
    expected: ["First", "Second"],
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.type(screen.getByRole("textbox"), "First");
      await user.click(addBtn());
      await user.type(screen.getByRole("textbox"), "Second");
      await user.click(addBtn());
      return labels();
    },
  },
  {
    name: "ignores empty input",
    input: "click Add with the input empty",
    expected: [],
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(addBtn());
      return labels();
    },
  },
  {
    name: "clears the input after adding",
    input: 'type "Something", click Add, then read the input value',
    expected: "",
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      const input = screen.getByRole("textbox");
      await user.type(input, "Something");
      await user.click(addBtn());
      return (input as HTMLInputElement).value;
    },
  },
  {
    name: "deletes a single todo",
    input: 'add "Temp", then click its Delete button',
    expected: [],
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.type(screen.getByRole("textbox"), "Temp");
      await user.click(addBtn());
      const item = screen.getByRole("listitem");
      await user.click(within(item).getByRole("button", { name: /delete/i }));
      return labels();
    },
  },
]);
`,
  },
};
