<script setup lang="ts">
const SECTIONS = [
  { id: "a", title: "Section A", body: "The body of section A." },
  { id: "b", title: "Section B", body: "The body of section B." },
  { id: "c", title: "Section C", body: "The body of section C." },
];

// TODO:
//  - track which sections are open (they toggle independently)
//  - each header is a button with aria-expanded reflecting its state
//  - render a section's body only when it is open
</script>

<template>
  <main style="font-family: sans-serif; padding: 1rem; max-width: 420px">
    <h1>Accordion</h1>
    <section v-for="s in SECTIONS" :key="s.id">
      <h2 style="margin: 0">
        <button type="button" :aria-expanded="false">{{ s.title }}</button>
      </h2>
    </section>
  </main>
</template>
