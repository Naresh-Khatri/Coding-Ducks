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
