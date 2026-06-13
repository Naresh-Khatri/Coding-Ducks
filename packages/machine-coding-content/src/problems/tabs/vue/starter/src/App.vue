<script setup lang="ts">
const TABS = [
  { id: "html", label: "HTML", content: "HyperText Markup Language" },
  { id: "css", label: "CSS", content: "Cascading Style Sheets" },
  { id: "js", label: "JS", content: "JavaScript, the language of the web" },
];

// TODO:
//  - track the active tab id (default to the first)
//  - render role="tab" buttons in a role="tablist", with aria-selected
//  - show the active tab's content in a role="tabpanel"
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
        :aria-selected="false"
      >
        {{ t.label }}
      </button>
    </div>
    <div role="tabpanel" style="padding-top: 8px"></div>
  </main>
</template>
