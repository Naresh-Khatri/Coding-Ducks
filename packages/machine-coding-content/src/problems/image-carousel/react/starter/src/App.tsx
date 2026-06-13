import { useState } from "react";

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
