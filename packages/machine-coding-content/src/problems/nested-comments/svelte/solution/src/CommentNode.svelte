<script lang="ts">
  interface Comment {
    id: string;
    text: string;
    children: Comment[];
  }

  let {
    node,
    onReply,
  }: { node: Comment; onReply: (id: string, text: string) => void } = $props();

  let open = $state(false);
  let text = $state("");

  function submit(e: SubmitEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    onReply(node.id, value);
    text = "";
    open = false;
  }
</script>

<li>
  <span>{node.text}</span>
  <button
    type="button"
    aria-label={`Reply to ${node.text}`}
    onclick={() => (open = !open)}
  >
    Reply
  </button>
  {#if open}
    <form
      onsubmit={submit}
      style="display: inline-flex; gap: 4px; margin-left: 8px"
    >
      <input aria-label={`Reply to ${node.text}`} bind:value={text} />
      <button type="submit">Add</button>
    </form>
  {/if}
  {#if node.children.length > 0}
    <ul style="padding-left: 20px">
      {#each node.children as child (child.id)}
        <svelte:self node={child} {onReply} />
      {/each}
    </ul>
  {/if}
</li>
