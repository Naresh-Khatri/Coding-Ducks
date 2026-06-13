# Solution

Hold the list and the draft text in state. On submit, trim the draft, bail if
empty, append an item with a stable id, and clear the input. Delete filters by
id.

```tsx
const [todos, setTodos] = useState([]);
const [text, setText] = useState("");

const add = (e) => {
  e.preventDefault();
  const value = text.trim();
  if (!value) return;
  setTodos((prev) => [...prev, { id: crypto.randomUUID(), text: value }]);
  setText("");
};
```

Using a `<form>` with `onSubmit` gives you Enter-to-add for free and keeps
the button as a `submit`.
