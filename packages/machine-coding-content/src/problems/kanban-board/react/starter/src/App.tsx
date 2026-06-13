import { useState } from "react";

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
