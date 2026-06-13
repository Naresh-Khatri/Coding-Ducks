<script lang="ts">
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

  let sort = $state<Sort | null>(null);
  let page = $state(0);

  const sorted = $derived.by(() => {
    const s = sort;
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

  const pageCount = $derived(Math.max(1, Math.ceil(sorted.length / PAGE_SIZE)));
  const currentPage = $derived(Math.min(page, pageCount - 1));
  const visible = $derived(
    sorted.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE),
  );

  function sortBy(key: SortKey) {
    page = 0;
    sort =
      sort && sort.key === key
        ? { key, dir: sort.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" };
  }
</script>

<main style="font-family: sans-serif; padding: 1rem">
  <h1>Data Table</h1>
  <table>
    <thead>
      <tr>
        <th><button type="button" onclick={() => sortBy("name")}>Name</button></th>
        <th><button type="button" onclick={() => sortBy("age")}>Age</button></th>
      </tr>
    </thead>
    <tbody>
      {#each visible as r (r.name)}
        <tr>
          <td>{r.name}</td>
          <td>{r.age}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <div style="display: flex; gap: 8px; align-items: center; margin-top: 8px">
    <button
      type="button"
      onclick={() => (page = Math.max(0, page - 1))}
      disabled={currentPage === 0}
    >
      Prev
    </button>
    <span role="status">Page {currentPage + 1} of {pageCount}</span>
    <button
      type="button"
      onclick={() => (page = Math.min(pageCount - 1, page + 1))}
      disabled={currentPage >= pageCount - 1}
    >
      Next
    </button>
  </div>
</main>
