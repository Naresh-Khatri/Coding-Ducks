<script setup lang="ts">
import { computed, ref } from "vue";

const FRUITS = [
  "Apple",
  "Apricot",
  "Banana",
  "Blueberry",
  "Cherry",
  "Grape",
  "Mango",
  "Orange",
  "Peach",
  "Pear",
];

const query = ref("");
const open = ref(false);

const matches = computed(() =>
  query.value
    ? FRUITS.filter((f) => f.toLowerCase().includes(query.value.toLowerCase()))
    : [],
);

function pick(value: string) {
  query.value = value;
  open.value = false;
}
</script>

<template>
  <main style="font-family: sans-serif; padding: 1rem; max-width: 320px">
    <h1>Autocomplete</h1>
    <input
      aria-label="Search fruit"
      v-model="query"
      @input="open = true"
      placeholder="Type a fruit…"
    />
    <ul
      v-if="open && query"
      role="listbox"
      style="list-style: none; padding: 0; margin: 4px 0; border: 1px solid #ddd"
    >
      <li v-if="matches.length === 0" style="padding: 4px 8px; color: #888">
        No results
      </li>
      <li v-for="m in matches" v-else :key="m">
        <button
          type="button"
          role="option"
          :aria-selected="false"
          @click="pick(m)"
          style="width: 100%; text-align: left; padding: 4px 8px; border: none; background: none; cursor: pointer"
        >
          {{ m }}
        </button>
      </li>
    </ul>
  </main>
</template>
