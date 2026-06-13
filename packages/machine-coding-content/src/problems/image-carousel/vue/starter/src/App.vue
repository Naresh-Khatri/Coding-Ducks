<script setup lang="ts">
import { ref } from "vue";

const SLIDES = [
  { alt: "Mountains", src: "https://picsum.photos/seed/mountains/600/300" },
  { alt: "Beach", src: "https://picsum.photos/seed/beach/600/300" },
  { alt: "Forest", src: "https://picsum.photos/seed/forest/600/300" },
];

const index = ref(0);

// TODO:
//  - show SLIDES[index] as an <img> with its alt text
//  - Next / Previous buttons move the index, wrapping at both ends
//  - a role="status" shows "Slide X of N"
</script>

<template>
  <main style="font-family: sans-serif; padding: 1rem; max-width: 360px">
    <h1>Image Carousel</h1>
    <img
      :src="SLIDES[index].src"
      :alt="SLIDES[index].alt"
      style="width: 100%; height: 180px; object-fit: cover; background: #eee"
    />
  </main>
</template>
