import { useState } from "react";

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
