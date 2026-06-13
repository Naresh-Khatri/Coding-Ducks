<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const open = ref(false);

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") open.value = false;
}
onMounted(() => document.addEventListener("keydown", onKey));
onUnmounted(() => document.removeEventListener("keydown", onKey));
</script>

<template>
  <main style="font-family: sans-serif; padding: 1rem">
    <h1>Modal Dialog</h1>
    <button type="button" @click="open = true">Open</button>
    <div
      v-if="open"
      data-testid="backdrop"
      @click="open = false"
      style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); display: grid; place-items: center"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Confirm"
        @click.stop
        style="background: #fff; padding: 1.5rem; border-radius: 8px; min-width: 240px"
      >
        <p>Are you sure?</p>
        <button type="button" @click="open = false">Close</button>
      </div>
    </div>
  </main>
</template>
