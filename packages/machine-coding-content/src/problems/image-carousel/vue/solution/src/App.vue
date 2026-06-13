<script setup lang="ts">
import { computed, ref } from "vue";

const SLIDES = [
  { alt: "Mountains", src: "https://picsum.photos/seed/mountains/600/300" },
  { alt: "Beach", src: "https://picsum.photos/seed/beach/600/300" },
  { alt: "Forest", src: "https://picsum.photos/seed/forest/600/300" },
];

const index = ref(0);
const count = SLIDES.length;
const slide = computed(() => SLIDES[index.value]);
function go(delta: number) {
  index.value = (index.value + delta + count) % count;
}
</script>

<template>
  <main style="font-family: sans-serif; padding: 1rem; max-width: 360px">
    <h1>Image Carousel</h1>
    <img
      :src="slide.src"
      :alt="slide.alt"
      style="width: 100%; height: 180px; object-fit: cover; background: #eee"
    />
    <div
      style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px"
    >
      <button type="button" aria-label="Previous slide" @click="go(-1)">
        ‹ Prev
      </button>
      <span role="status">Slide {{ index + 1 }} of {{ count }}</span>
      <button type="button" aria-label="Next slide" @click="go(1)">Next ›</button>
    </div>
  </main>
</template>
