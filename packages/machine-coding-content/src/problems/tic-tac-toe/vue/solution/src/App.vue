<script setup lang="ts">
import { computed, ref } from "vue";

type Mark = "X" | "O" | null;

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function winnerOf(board: Mark[]): Mark {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

const board = ref<Mark[]>(Array(9).fill(null));
const xIsNext = ref(true);

const winner = computed(() => winnerOf(board.value));
const full = computed(() => board.value.every(Boolean));
const status = computed(() =>
  winner.value
    ? `Winner: ${winner.value}`
    : full.value
      ? "Draw"
      : `Next: ${xIsNext.value ? "X" : "O"}`,
);

function play(i: number) {
  if (board.value[i] || winner.value) return;
  const next = board.value.slice();
  next[i] = xIsNext.value ? "X" : "O";
  board.value = next;
  xIsNext.value = !xIsNext.value;
}

function reset() {
  board.value = Array(9).fill(null);
  xIsNext.value = true;
}
</script>

<template>
  <main style="font-family: sans-serif; padding: 1rem">
    <h1>Tic Tac Toe</h1>
    <p role="status">{{ status }}</p>
    <div
      style="display: grid; grid-template-columns: repeat(3, 4rem); gap: 4px; margin-bottom: 1rem"
    >
      <button
        v-for="(cell, i) in board"
        :key="i"
        type="button"
        :aria-label="`Cell ${i}`"
        @click="play(i)"
        style="height: 4rem; font-size: 1.5rem"
      >
        {{ cell }}
      </button>
    </div>
    <button type="button" @click="reset">Reset</button>
  </main>
</template>
