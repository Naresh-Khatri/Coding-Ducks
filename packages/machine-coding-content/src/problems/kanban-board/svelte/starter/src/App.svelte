<script lang="ts">
  const COLUMNS = ["To Do", "In Progress", "Done"];

  interface Card {
    id: string;
    text: string;
    col: number;
  }

  let cards = $state<Card[]>([]);

  // TODO:
  //  - each column (a labelled region) has an input + Add button
  //  - Add appends a card to that column; ignore empty input
  //  - each card has Move left / Move right buttons (disabled at the ends)
</script>

<main style="font-family: sans-serif; padding: 1rem">
  <h1>Kanban Board</h1>
  <div style="display: flex; gap: 16px; align-items: flex-start">
    {#each COLUMNS as name (name)}
      <section aria-label={name} style="flex: 1">
        <h2 style="font-size: 1rem">{name}</h2>
      </section>
    {/each}
  </div>
</main>
