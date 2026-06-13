import { useState } from "react";

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
