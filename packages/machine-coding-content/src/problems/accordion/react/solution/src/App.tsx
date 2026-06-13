import { useState } from "react";

const SECTIONS = [
  { id: "a", title: "Section A", body: "The body of section A." },
  { id: "b", title: "Section B", body: "The body of section B." },
  { id: "c", title: "Section C", body: "The body of section C." },
];

export default function App() {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (id: string) =>
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem", maxWidth: 420 }}>
      <h1>Accordion</h1>
      {SECTIONS.map((s) => {
        const isOpen = Boolean(open[s.id]);
        return (
          <section key={s.id} style={{ borderBottom: "1px solid #ddd" }}>
            <h2 style={{ margin: 0 }}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggle(s.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 4px",
                  background: "none",
                  border: "none",
                  font: "inherit",
                  cursor: "pointer",
                }}
              >
                {s.title}
              </button>
            </h2>
            {isOpen && <div style={{ padding: "4px 4px 12px" }}>{s.body}</div>}
          </section>
        );
      })}
    </main>
  );
}
