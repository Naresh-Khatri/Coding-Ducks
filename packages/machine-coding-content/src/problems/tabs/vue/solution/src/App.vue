<script setup lang="ts">
import { computed, ref } from "vue";

const TABS = [
  { id: "html", label: "HTML", content: "HyperText Markup Language" },
  { id: "css", label: "CSS", content: "Cascading Style Sheets" },
  { id: "js", label: "JS", content: "JavaScript, the language of the web" },
];

const active = ref(TABS[0].id);
const current = computed(() => TABS.find((t) => t.id === active.value) ?? TABS[0]);
</script>

<template>
  <main style="font-family: sans-serif; padding: 1rem">
    <h1>Tabs</h1>
    <div role="tablist" style="display: flex; gap: 4px">
      <button
        v-for="t in TABS"
        :key="t.id"
        type="button"
        role="tab"
        :aria-selected="t.id === active"
        @click="active = t.id"
        :style="{
          padding: '6px 12px',
          border: '1px solid #ccc',
          borderBottom: t.id === active ? '2px solid #3178c6' : '1px solid #ccc',
          background: t.id === active ? '#eef4fb' : '#fff',
          cursor: 'pointer',
        }"
      >
        {{ t.label }}
      </button>
    </div>
    <div role="tabpanel" style="padding-top: 8px">{{ current.content }}</div>
  </main>
</template>
