<script lang="ts">
  const SLIDES = [
    { alt: "Mountains", src: "https://picsum.photos/seed/mountains/600/300" },
    { alt: "Beach", src: "https://picsum.photos/seed/beach/600/300" },
    { alt: "Forest", src: "https://picsum.photos/seed/forest/600/300" },
  ];

  let index = $state(0);
  const count = SLIDES.length;
  const slide = $derived(SLIDES[index]);
  function go(delta: number) {
    index = (index + delta + count) % count;
  }
</script>

<main style="font-family: sans-serif; padding: 1rem; max-width: 360px">
  <h1>Image Carousel</h1>
  <img
    src={slide.src}
    alt={slide.alt}
    style="width: 100%; height: 180px; object-fit: cover; background: #eee"
  />
  <div
    style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px"
  >
    <button type="button" aria-label="Previous slide" onclick={() => go(-1)}>
      ‹ Prev
    </button>
    <span role="status">Slide {index + 1} of {count}</span>
    <button type="button" aria-label="Next slide" onclick={() => go(1)}>Next ›</button>
  </div>
</main>
