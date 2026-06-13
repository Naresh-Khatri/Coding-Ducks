<script lang="ts">
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

  let query = $state("");
  let open = $state(false);

  const matches = $derived(
    query
      ? FRUITS.filter((f) => f.toLowerCase().includes(query.toLowerCase()))
      : [],
  );

  function pick(value: string) {
    query = value;
    open = false;
  }
</script>

<main style="font-family: sans-serif; padding: 1rem; max-width: 320px">
  <h1>Autocomplete</h1>
  <input
    aria-label="Search fruit"
    bind:value={query}
    oninput={() => (open = true)}
    placeholder="Type a fruit…"
  />
  {#if open && query}
    <ul
      role="listbox"
      style="list-style: none; padding: 0; margin: 4px 0; border: 1px solid #ddd"
    >
      {#if matches.length === 0}
        <li style="padding: 4px 8px; color: #888">No results</li>
      {:else}
        {#each matches as m (m)}
          <li>
            <button
              type="button"
              role="option"
              aria-selected={false}
              onclick={() => pick(m)}
              style="width: 100%; text-align: left; padding: 4px 8px; border: none; background: none; cursor: pointer"
            >
              {m}
            </button>
          </li>
        {/each}
      {/if}
    </ul>
  {/if}
</main>
