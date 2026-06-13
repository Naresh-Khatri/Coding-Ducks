import { useEffect, useState } from "react";

export default function App() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>Modal Dialog</h1>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      {open && (
        <div
          data-testid="backdrop"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              padding: "1.5rem",
              borderRadius: 8,
              minWidth: 240,
            }}
          >
            <p>Are you sure?</p>
            <button type="button" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
