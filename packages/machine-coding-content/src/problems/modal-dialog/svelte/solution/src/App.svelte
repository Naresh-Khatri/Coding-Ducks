<script lang="ts">
  import { onMount } from "svelte";

  let open = $state(false);

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") open = false;
  }
  onMount(() => {
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });
</script>

<main style="font-family: sans-serif; padding: 1rem">
  <h1>Modal Dialog</h1>
  <button type="button" onclick={() => (open = true)}>Open</button>
  {#if open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      data-testid="backdrop"
      onclick={() => (open = false)}
      style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); display: grid; place-items: center"
    >
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Confirm"
        onclick={(e) => e.stopPropagation()}
        style="background: #fff; padding: 1.5rem; border-radius: 8px; min-width: 240px"
      >
        <p>Are you sure?</p>
        <button type="button" onclick={() => (open = false)}>Close</button>
      </div>
    </div>
  {/if}
</main>
