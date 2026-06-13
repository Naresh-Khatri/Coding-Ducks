import { useState } from "react";

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
