import { useState } from "react";

export default function App() {
  const [open, setOpen] = useState(false);

  // TODO:
  //  - show the dialog (role="dialog", aria-modal) only when open
  //  - close on the Close button, on Escape, and on a backdrop click
  //  - clicking inside the dialog must NOT close it
  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>Modal Dialog</h1>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
    </main>
  );
}
