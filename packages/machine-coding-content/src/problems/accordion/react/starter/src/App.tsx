import { useState } from "react";

const SECTIONS = [
  { id: "a", title: "Section A", body: "The body of section A." },
  { id: "b", title: "Section B", body: "The body of section B." },
  { id: "c", title: "Section C", body: "The body of section C." },
];

export default function App() {
  // TODO:
  //  - track which sections are open (they toggle independently)
  //  - each header is a button with aria-expanded reflecting its state
  //  - render a section's body only when it is open
  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem", maxWidth: 420 }}>
      <h1>Accordion</h1>
      {SECTIONS.map((s) => (
        <section key={s.id}>
          <h2 style={{ margin: 0 }}>
            <button type="button" aria-expanded={false}>
              {s.title}
            </button>
          </h2>
        </section>
      ))}
    </main>
  );
}
