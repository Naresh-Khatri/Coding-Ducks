import { useState } from "react";

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
