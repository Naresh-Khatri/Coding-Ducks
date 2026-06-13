<script setup lang="ts">
import { ref } from "vue";

interface Todo {
  id: string;
  text: string;
}

const todos = ref<Todo[]>([]);
const text = ref("");

function add() {
  const value = text.value.trim();
  if (!value) return;
  todos.value.push({ id: crypto.randomUUID(), text: value });
  text.value = "";
}

function remove(id: string) {
  todos.value = todos.value.filter((t) => t.id !== id);
}
</script>

<template>
  <main style="font-family: sans-serif; padding: 1rem; max-width: 420px">
    <h1>Todo List</h1>
    <form @submit.prevent="add" style="display: flex; gap: 8px">
      <input
        aria-label="New todo"
        placeholder="Add a todo"
        v-model="text"
        style="flex: 1"
      />
      <button type="submit">Add</button>
    </form>
    <ul>
      <li
        v-for="t in todos"
        :key="t.id"
        style="display: flex; justify-content: space-between; gap: 8px; padding: 4px 0"
      >
        <span>{{ t.text }}</span>
        <button type="button" @click="remove(t.id)">Delete {{ t.text }}</button>
      </li>
    </ul>
  </main>
</template>
