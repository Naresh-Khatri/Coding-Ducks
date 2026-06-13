<script setup lang="ts">
// TODO:
//  - track the list of todos and the input text in reactive state (ref)
//  - "Add" (or Enter) appends the trimmed text; ignore empty input
//  - each item has a "Delete" button that removes only that item
</script>

<template>
  <main style="font-family: sans-serif; padding: 1rem; max-width: 420px">
    <h1>Todo List</h1>
    <form>
      <input aria-label="New todo" placeholder="Add a todo" />
      <button type="submit">Add</button>
    </form>
    <ul></ul>
  </main>
</template>
