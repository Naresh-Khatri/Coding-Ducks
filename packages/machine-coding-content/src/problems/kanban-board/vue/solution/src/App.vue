<script setup lang="ts">
import { ref } from "vue";

const COLUMNS = ["To Do", "In Progress", "Done"];

interface Card {
  id: string;
  text: string;
  col: number;
}

const cards = ref<Card[]>([]);
const drafts = ref<string[]>(COLUMNS.map(() => ""));

function add(col: number) {
  const text = drafts.value[col].trim();
  if (!text) return;
  cards.value = [...cards.value, { id: crypto.randomUUID(), text, col }];
  drafts.value[col] = "";
}

function move(id: string, delta: number) {
  cards.value = cards.value.map((card) =>
    card.id === id
      ? {
          ...card,
          col: Math.max(0, Math.min(COLUMNS.length - 1, card.col + delta)),
        }
      : card,
  );
}

function cardsIn(col: number) {
  return cards.value.filter((c) => c.col === col);
}
</script>

<template>
  <main style="font-family: sans-serif; padding: 1rem">
    <h1>Kanban Board</h1>
    <div style="display: flex; gap: 16px; align-items: flex-start">
      <section
        v-for="(name, col) in COLUMNS"
        :key="name"
        :aria-label="name"
        style="flex: 1; background: #f3f4f6; padding: 8px; border-radius: 8px"
      >
        <h2 style="font-size: 1rem; margin-top: 0">{{ name }}</h2>
        <form @submit.prevent="add(col)" style="display: flex; gap: 4px">
          <input
            :aria-label="`Add to ${name}`"
            v-model="drafts[col]"
            style="width: 100%; min-width: 0"
          />
          <button type="submit">Add</button>
        </form>
        <ul style="list-style: none; padding: 0; margin: 8px 0 0">
          <li
            v-for="card in cardsIn(col)"
            :key="card.id"
            style="background: #fff; padding: 6px; margin-top: 6px; border-radius: 6px"
          >
            <span>{{ card.text }}</span>
            <div style="margin-top: 4px; display: flex; gap: 4px">
              <button
                type="button"
                :aria-label="`Move ${card.text} left`"
                :disabled="card.col === 0"
                @click="move(card.id, -1)"
              >
                ◀
              </button>
              <button
                type="button"
                :aria-label="`Move ${card.text} right`"
                :disabled="card.col === COLUMNS.length - 1"
                @click="move(card.id, 1)"
              >
                ▶
              </button>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </main>
</template>
