import type { MachineCodingProblem } from "../types";

const DESCRIPTION = `# Nested Comments

Render a threaded comment tree where any comment can be replied to, nesting the
reply beneath it.

## Requirements

- Render the comment tree **recursively**, indenting replies under their parent.
- Each comment has a **Reply** button that toggles a reply input for that comment.
- Submitting a non-empty reply adds it as a child of that comment and closes the input.
- Empty (whitespace-only) replies are ignored.

Implement it in \`src/App.tsx\`.
`;

const EDITORIAL = `# Solution

Model comments as a tree of \`{ id, text, children }\`. A small recursive component
renders one node and its children. Adding a reply is an immutable update that
walks the tree and rebuilds only the branch leading to the target parent.

\`\`\`tsx
function addReply(nodes: Comment[], parentId: string, text: string): Comment[] {
  return nodes.map((n) =>
    n.id === parentId
      ? { ...n, children: [...n.children, makeComment(text)] }
      : { ...n, children: addReply(n.children, parentId, text) },
  );
}
\`\`\`

Because each node keeps its own "is the reply box open?" state locally, opening
one reply box doesn't disturb any of the others.
`;

export const nestedComments: MachineCodingProblem = {
  slug: "nested-comments",
  title: "Nested Comments",
  difficulty: "hard",
  category: "ui-component",
  durationMinutes: 45,
  tags: ["React", "Recursion", "Trees"],
  companies: ["Reddit", "Meta", "Google"],
  templateId: "react-ts",
  displayOrder: 160,
  description: DESCRIPTION,
  editorial: EDITORIAL,
  starterFiles: {
    "src/App.tsx": `import { useState } from "react";

interface Comment {
  id: string;
  text: string;
  children: Comment[];
}

const INITIAL: Comment[] = [
  {
    id: "1",
    text: "First comment",
    children: [{ id: "2", text: "A reply to the first", children: [] }],
  },
  { id: "3", text: "Second comment", children: [] },
];

export default function App() {
  const [tree] = useState<Comment[]>(INITIAL);

  // TODO:
  //  - render the tree recursively, nesting children under their parent
  //  - each comment has a Reply button toggling an input + Add button
  //  - submitting a non-empty reply adds it as a child of that comment
  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>Nested Comments</h1>
      <ul>
        {tree.map((c) => (
          <li key={c.id}>{c.text}</li>
        ))}
      </ul>
    </main>
  );
}
`,
  },
  solutionFiles: {
    "src/App.tsx": `import { useState } from "react";

interface Comment {
  id: string;
  text: string;
  children: Comment[];
}

const INITIAL: Comment[] = [
  {
    id: "1",
    text: "First comment",
    children: [{ id: "2", text: "A reply to the first", children: [] }],
  },
  { id: "3", text: "Second comment", children: [] },
];

let counter = 0;
const makeComment = (text: string): Comment => ({
  id: "c" + ++counter,
  text,
  children: [],
});

function addReply(
  nodes: Comment[],
  parentId: string,
  text: string,
): Comment[] {
  return nodes.map((n) =>
    n.id === parentId
      ? { ...n, children: [...n.children, makeComment(text)] }
      : { ...n, children: addReply(n.children, parentId, text) },
  );
}

function CommentNode({
  node,
  onReply,
}: {
  node: Comment;
  onReply: (id: string, text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    onReply(node.id, value);
    setText("");
    setOpen(false);
  };

  return (
    <li>
      <span>{node.text}</span>{" "}
      <button
        type="button"
        aria-label={"Reply to " + node.text}
        onClick={() => setOpen((o) => !o)}
      >
        Reply
      </button>
      {open && (
        <form
          onSubmit={submit}
          style={{ display: "inline-flex", gap: 4, marginLeft: 8 }}
        >
          <input
            aria-label={"Reply to " + node.text}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>
      )}
      {node.children.length > 0 && (
        <ul style={{ paddingLeft: 20 }}>
          {node.children.map((child) => (
            <CommentNode key={child.id} node={child} onReply={onReply} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function App() {
  const [tree, setTree] = useState<Comment[]>(INITIAL);
  const reply = (id: string, text: string) =>
    setTree((t) => addReply(t, id, text));

  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>Nested Comments</h1>
      <ul>
        {tree.map((c) => (
          <CommentNode key={c.id} node={c} onReply={reply} />
        ))}
      </ul>
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
      render(<App />);
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
      render(<App />);
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
      render(<App />);
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
      render(<App />);
      const before = itemCount();
      await user.click(replyButton("First comment"));
      await user.click(screen.getByRole("button", { name: "Add" }));
      return itemCount() === before;
    },
  },
]);
`,
  },
};
