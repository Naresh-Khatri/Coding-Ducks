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
