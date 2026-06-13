<script setup lang="ts">
import { ref } from "vue";

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

// TODO:
//  - filter FRUITS by case-insensitive substring of the query
//  - render the matches in a role="listbox"; hide it when the query is empty
//  - show "No results" when nothing matches
//  - clicking a suggestion fills the input and closes the list
</script>

<template>
  <main style="font-family: sans-serif; padding: 1rem; max-width: 320px">
    <h1>Autocomplete</h1>
    <input aria-label="Search fruit" v-model="query" placeholder="Type a fruit…" />
  </main>
</template>
