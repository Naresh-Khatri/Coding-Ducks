<script setup lang="ts">
import { computed, ref } from "vue";

const STARS = [1, 2, 3, 4, 5];

const rating = ref(0);
const hover = ref(0);
const active = computed(() => hover.value || rating.value);
</script>

<template>
  <main style="font-family: sans-serif; padding: 1rem">
    <h1>Star Rating</h1>
    <div
      @mouseleave="hover = 0"
      style="display: flex; gap: 4px; font-size: 2rem"
    >
      <button
        v-for="n in STARS"
        :key="n"
        type="button"
        :aria-label="`Rate ${n}`"
        @mouseenter="hover = n"
        @focus="hover = n"
        @click="rating = n"
        :style="{
          cursor: 'pointer',
          border: 'none',
          background: 'none',
          padding: 0,
          lineHeight: 1,
          color: n <= active ? '#f5a623' : '#ccc',
        }"
      >
        {{ n <= active ? "★" : "☆" }}
      </button>
    </div>
    <p role="status">{{ rating ? "Rated: " + rating : "No rating" }}</p>
  </main>
</template>
