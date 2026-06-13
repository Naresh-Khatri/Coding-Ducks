<script setup lang="ts">
import { computed, ref } from "vue";

interface Row {
  name: string;
  age: number;
}

const ROWS: Row[] = [
  { name: "Carol", age: 30 },
  { name: "Alice", age: 25 },
  { name: "Dave", age: 22 },
  { name: "Bob", age: 28 },
  { name: "Erin", age: 35 },
];

const PAGE_SIZE = 2;
type SortKey = keyof Row;
interface Sort {
  key: SortKey;
  dir: "asc" | "desc";
}

const sort = ref<Sort | null>(null);
const page = ref(0);

const sorted = computed<Row[]>(() => {
  const s = sort.value;
  if (!s) return ROWS;
  return [...ROWS].sort((a, b) => {
    const x = a[s.key];
    const y = b[s.key];
    const cmp =
      typeof x === "number" && typeof y === "number"
        ? x - y
        : String(x).localeCompare(String(y));
    return s.dir === "asc" ? cmp : -cmp;
  });
});

const pageCount = computed(() =>
  Math.max(1, Math.ceil(sorted.value.length / PAGE_SIZE)),
);
const currentPage = computed(() => Math.min(page.value, pageCount.value - 1));
const visible = computed(() =>
  sorted.value.slice(
    currentPage.value * PAGE_SIZE,
    currentPage.value * PAGE_SIZE + PAGE_SIZE,
  ),
);

function sortBy(key: SortKey) {
  page.value = 0;
  const s = sort.value;
  sort.value =
    s && s.key === key
      ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
      : { key, dir: "asc" };
}

function prev() {
  page.value = Math.max(0, page.value - 1);
}
function next() {
  page.value = Math.min(pageCount.value - 1, page.value + 1);
}
</script>

<template>
  <main style="font-family: sans-serif; padding: 1rem">
    <h1>Data Table</h1>
    <table>
      <thead>
        <tr>
          <th><button type="button" @click="sortBy('name')">Name</button></th>
          <th><button type="button" @click="sortBy('age')">Age</button></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in visible" :key="r.name">
          <td>{{ r.name }}</td>
          <td>{{ r.age }}</td>
        </tr>
      </tbody>
    </table>
    <div style="display: flex; gap: 8px; align-items: center; margin-top: 8px">
      <button type="button" @click="prev" :disabled="currentPage === 0">
        Prev
      </button>
      <span role="status">Page {{ currentPage + 1 }} of {{ pageCount }}</span>
      <button
        type="button"
        @click="next"
        :disabled="currentPage >= pageCount - 1"
      >
        Next
      </button>
    </div>
  </main>
</template>
