<script lang="ts">
  let open = $state(false);

  // TODO:
  //  - show the dialog (role="dialog", aria-modal) only when open
  //  - close on the Close button, on Escape, and on a backdrop click
  //  - clicking inside the dialog must NOT close it
</script>

<main style="font-family: sans-serif; padding: 1rem">
  <h1>Modal Dialog</h1>
  <button type="button" onclick={() => (open = true)}>Open</button>
</main>
