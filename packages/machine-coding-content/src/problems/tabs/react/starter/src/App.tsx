import { useState } from "react";

const TABS = [
  { id: "html", label: "HTML", content: "HyperText Markup Language" },
  { id: "css", label: "CSS", content: "Cascading Style Sheets" },
  { id: "js", label: "JS", content: "JavaScript, the language of the web" },
];

export default function App() {
  // TODO:
  //  - track the active tab id (default to the first)
  //  - render role="tab" buttons in a role="tablist", with aria-selected
  //  - show the active tab's content in a role="tabpanel"
  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>Tabs</h1>
      <div role="tablist" style={{ display: "flex", gap: 4 }}>
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={false}>
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" style={{ paddingTop: 8 }} />
    </main>
  );
}
