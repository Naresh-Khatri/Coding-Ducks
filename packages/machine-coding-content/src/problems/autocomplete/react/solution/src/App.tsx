import { useState } from "react";

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
