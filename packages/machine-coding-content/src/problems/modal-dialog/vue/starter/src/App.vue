<script setup lang="ts">
import { ref } from "vue";

const open = ref(false);

// TODO:
//  - show the dialog (role="dialog", aria-modal) only when open
//  - close on the Close button, on Escape, and on a backdrop click
//  - clicking inside the dialog must NOT close it
</script>

<template>
  <main style="font-family: sans-serif; padding: 1rem">
    <h1>Modal Dialog</h1>
    <button type="button" @click="open = true">Open</button>
  </main>
</template>
