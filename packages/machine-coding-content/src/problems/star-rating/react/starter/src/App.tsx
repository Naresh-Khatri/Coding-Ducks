import { useState } from "react";

const STARS = [1, 2, 3, 4, 5];

export default function App() {
  // TODO:
  //  - track the committed rating and a transient hover value
  //  - each star button is labelled "Rate N" and shows ★ when N <= active
  //  - clicking sets the rating; hovering previews; mouse-leave restores
  //  - a role="status" shows "Rated: N" or "No rating"
  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h1>Star Rating</h1>
      <div>
        {STARS.map((n) => (
          <button key={n} type="button" aria-label={"Rate " + n}>
            ☆
          </button>
        ))}
      </div>
      <p role="status">No rating</p>
    </main>
  );
}
