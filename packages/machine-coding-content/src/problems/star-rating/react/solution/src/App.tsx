import { useState } from "react";

const STARS = [1, 2, 3, 4, 5];

export default function App() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const active = hover || rating;

  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>Star Rating</h1>
      <div
        onMouseLeave={() => setHover(0)}
        style={{ display: "flex", gap: 4, fontSize: "2rem" }}
      >
        {STARS.map((n) => (
          <button
            key={n}
            type="button"
            aria-label={"Rate " + n}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onClick={() => setRating(n)}
            style={{
              cursor: "pointer",
              border: "none",
              background: "none",
              padding: 0,
              lineHeight: 1,
              color: n <= active ? "#f5a623" : "#ccc",
            }}
          >
            {n <= active ? "★" : "☆"}
          </button>
        ))}
      </div>
      <p role="status">{rating ? "Rated: " + rating : "No rating"}</p>
    </main>
  );
}
