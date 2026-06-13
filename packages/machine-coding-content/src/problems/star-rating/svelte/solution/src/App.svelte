<script lang="ts">
  const STARS = [1, 2, 3, 4, 5];

  let rating = $state(0);
  let hover = $state(0);
  const active = $derived(hover || rating);
</script>

<main style="font-family: sans-serif; padding: 1rem">
  <h1>Star Rating</h1>
  <!-- svelte-ignore a11y_mouse_events_have_key_events -->
  <div
    onmouseleave={() => (hover = 0)}
    style="display: flex; gap: 4px; font-size: 2rem"
  >
    {#each STARS as n (n)}
      <button
        type="button"
        aria-label={`Rate ${n}`}
        onmouseenter={() => (hover = n)}
        onfocus={() => (hover = n)}
        onclick={() => (rating = n)}
        style="cursor: pointer; border: none; background: none; padding: 0; line-height: 1; color: {n <=
        active
          ? '#f5a623'
          : '#ccc'}"
      >
        {n <= active ? "★" : "☆"}
      </button>
    {/each}
  </div>
  <p role="status">{rating ? "Rated: " + rating : "No rating"}</p>
</main>
