import type { MachineCodingProblem } from "../types";

const DESCRIPTION = `# Image Carousel

Build a carousel that shows one image at a time with Previous / Next controls.

## Requirements

- Show a single slide at a time as an \`<img>\` with its \`alt\` text.
- **Next** and **Previous** buttons (accessible labels "Next slide" / "Previous slide") move between slides.
- Navigation **wraps**: Next past the last slide goes to the first; Previous before the first goes to the last.
- A \`role="status"\` shows \`Slide X of N\`.

Implement it in \`src/App.tsx\`.
`;

const EDITORIAL = `# Solution

Keep just the current index. Wrapping in both directions falls out of modular
arithmetic — add the slide count before taking the remainder so a negative step
still lands in range.

\`\`\`tsx
const go = (delta: number) =>
  setIndex((i) => (i + delta + SLIDES.length) % SLIDES.length);
\`\`\`

Driving the view from a single index keeps the image, the counter, and (if you add
them) the dots all in sync automatically.
`;

export const imageCarousel: MachineCodingProblem = {
  slug: "image-carousel",
  title: "Image Carousel",
  difficulty: "medium",
  category: "ui-component",
  durationMinutes: 30,
  tags: ["React", "State", "Accessibility"],
  companies: ["Amazon", "Airbnb", "Netflix"],
  templateId: "react-ts",
  displayOrder: 140,
  description: DESCRIPTION,
  editorial: EDITORIAL,
  starterFiles: {
    "src/App.tsx": `import { useState } from "react";

const SLIDES = [
  { alt: "Mountains", src: "https://picsum.photos/seed/mountains/600/300" },
  { alt: "Beach", src: "https://picsum.photos/seed/beach/600/300" },
  { alt: "Forest", src: "https://picsum.photos/seed/forest/600/300" },
];

export default function App() {
  const [index, setIndex] = useState(0);

  // TODO:
  //  - show SLIDES[index] as an <img> with its alt text
  //  - Next / Previous buttons move the index, wrapping at both ends
  //  - a role="status" shows "Slide X of N"
  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem", maxWidth: 360 }}>
      <h1>Image Carousel</h1>
      <img
        src={SLIDES[index].src}
        alt={SLIDES[index].alt}
        style={{ width: "100%", height: 180, objectFit: "cover", background: "#eee" }}
      />
    </main>
  );
}
`,
  },
  solutionFiles: {
    "src/App.tsx": `import { useState } from "react";

const SLIDES = [
  { alt: "Mountains", src: "https://picsum.photos/seed/mountains/600/300" },
  { alt: "Beach", src: "https://picsum.photos/seed/beach/600/300" },
  { alt: "Forest", src: "https://picsum.photos/seed/forest/600/300" },
];

export default function App() {
  const [index, setIndex] = useState(0);
  const count = SLIDES.length;
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);
  const slide = SLIDES[index];

  return (
    <main style={{ fontFamily: "sans-serif", padding: "1rem", maxWidth: 360 }}>
      <h1>Image Carousel</h1>
      <img
        src={slide.src}
        alt={slide.alt}
        style={{ width: "100%", height: 180, objectFit: "cover", background: "#eee" }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 8,
        }}
      >
        <button type="button" aria-label="Previous slide" onClick={() => go(-1)}>
          ‹ Prev
        </button>
        <span role="status">{"Slide " + (index + 1) + " of " + count}</span>
        <button type="button" aria-label="Next slide" onClick={() => go(1)}>
          Next ›
        </button>
      </div>
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

const current = () => screen.getByRole("img").getAttribute("alt") ?? "";
const status = () => screen.getByRole("status").textContent ?? "";
const next = () => screen.getByRole("button", { name: "Next slide" });
const prev = () => screen.getByRole("button", { name: "Previous slide" });

cases("Image Carousel", [
  {
    name: "shows the first slide",
    input: "render the carousel",
    expected: { alt: "Mountains", status: "Slide 1 of 3" },
    run: () => {
      render(<App />);
      return { alt: current(), status: status() };
    },
  },
  {
    name: "Next advances to the following slide",
    input: "click Next",
    expected: { alt: "Beach", status: "Slide 2 of 3" },
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(next());
      return { alt: current(), status: status() };
    },
  },
  {
    name: "Previous goes back",
    input: "Next, then Previous",
    expected: "Mountains",
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(next());
      await user.click(prev());
      return current();
    },
  },
  {
    name: "wraps from the last slide to the first",
    input: "click Next three times",
    expected: { alt: "Mountains", status: "Slide 1 of 3" },
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(next());
      await user.click(next());
      await user.click(next());
      return { alt: current(), status: status() };
    },
  },
  {
    name: "wraps from the first slide to the last with Previous",
    input: "click Previous once",
    expected: { alt: "Forest", status: "Slide 3 of 3" },
    run: async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(prev());
      return { alt: current(), status: status() };
    },
  },
]);
`,
  },
};
