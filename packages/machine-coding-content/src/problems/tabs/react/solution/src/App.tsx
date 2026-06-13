import { useState } from "react";

const TABS = [
  { id: "html", label: "HTML", content: "HyperText Markup Language" },
  { id: "css", label: "CSS", content: "Cascading Style Sheets" },
  { id: "js", label: "JS", content: "JavaScript, the language of the web" },
];

export default function App() {
  const [active, setActive] = useState(TABS[0].id);
  const current = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>Tabs</h1>
      <div role="tablist" style={{ display: "flex", gap: 4 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === active}
            onClick={() => setActive(t.id)}
            style={{
              padding: "6px 12px",
              border: "1px solid #ccc",
              borderBottom:
                t.id === active ? "2px solid #3178c6" : "1px solid #ccc",
              background: t.id === active ? "#eef4fb" : "#fff",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" style={{ paddingTop: 8 }}>
        {current.content}
      </div>
    </main>
  );
}
