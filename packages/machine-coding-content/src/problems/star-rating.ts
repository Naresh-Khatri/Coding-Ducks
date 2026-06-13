import type { MachineCodingProblem } from "../types";

const DESCRIPTION = `# Star Rating

Build a 5-star rating widget.

## Requirements

- Render 5 star buttons, each with an accessible label \`Rate N\` (N = 1–5).
- A star shows filled (\`★\`) when its position is ≤ the current rating, otherwise empty (\`☆\`).
- Clicking star N sets the rating to N.
- **Hovering** star N previews a rating of N (stars fill up to it) without committing; moving the pointer away restores the committed rating.
- A \`role="status"\` element shows \`Rated: N\`, or \`No rating\` before anything is picked.

Implement it in \`src/App.tsx\`.
`;

const EDITORIAL = `# Solution

Track two pieces of state: the committed \`rating\` and a transient \`hover\`. The
stars fill up to \`hover || rating\`, so hovering previews without overwriting the
committed value, and clearing \`hover\` on mouse-leave restores the committed view.

\`\`\`tsx
const [rating, setRating] = useState(0);
const [hover, setHover] = useState(0);
const active = hover || rating;
\`\`\`

Each star is a real \`<button>\` (focusable, labelled) rather than a \`<span>\`, which
keeps the widget keyboard- and screen-reader-friendly.
`;

export const starRating: MachineCodingProblem = {
  slug: "star-rating",
  title: "Star Rating",
  difficulty: "easy",
  category: "ui-component",
  durationMinutes: 25,
  tags: ["React", "State", "Accessibility"],
  companies: ["Amazon", "Airbnb", "Booking.com"],
  templateId: "react-ts",
  displayOrder: 80,
  description: DESCRIPTION,
  editorial: EDITORIAL,
  starterFiles: {
    "src/App.tsx": `import { useState } from "react";

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
`,
  },
  solutionFiles: {
    "src/App.tsx": `import { useState } from "react";

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
`,
  },
  testFiles: {
    "src/App.test.tsx": `import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App";
import { cases } from "./mc-test";

const star = (n: number) => screen.getByRole("button", { name: "Rate " + n });
const marks = () => [1, 2, 3, 4, 5].map((n) => star(n).textContent ?? "");
const filled = () => marks().filter((m) => m === "★").length;
const status = () => screen.getByRole("status").textContent ?? "";

cases("Star Rating", [
  {
    name: "shows no rating initially",
    input: "render the widget",
    expected: { status: "No rating", filled: 0 },
    run: () => {
      render(<App />);
      return { status: status(), filled: filled() };
    },
  },
  {
    name: "clicking a star sets the rating",
    input: "click Rate 3",
    expected: "Rated: 3",
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(star(3));
      return status();
    },
  },
  {
    name: "fills stars up to the clicked one",
    input: "click Rate 3",
    expected: ["★", "★", "★", "☆", "☆"],
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(star(3));
      return marks();
    },
  },
  {
    name: "re-rating updates the value",
    input: "click Rate 4, then Rate 2",
    expected: { status: "Rated: 2", filled: 2 },
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(star(4));
      await user.click(star(2));
      return { status: status(), filled: filled() };
    },
  },
  {
    name: "hovering previews without committing",
    input: "hover Rate 4 (no click)",
    expected: { status: "No rating", filled: 4 },
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.hover(star(4));
      return { status: status(), filled: filled() };
    },
  },
]);
`,
  },
};
