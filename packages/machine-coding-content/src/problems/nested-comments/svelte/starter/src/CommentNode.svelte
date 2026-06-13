<script lang="ts">
  interface Comment {
    id: string;
    text: string;
    children: Comment[];
  }

  let { node }: { node: Comment; onReply: (id: string, text: string) => void } =
    $props();

  // TODO:
  //  - a Reply button (aria-label `Reply to {text}`) toggles an input + Add button
  //  - submitting a non-empty reply calls onReply(node.id, value)
</script>

<li>
  <span>{node.text}</span>
  <button type="button" aria-label={`Reply to ${node.text}`}>Reply</button>
  {#if node.children.length > 0}
    <ul style="padding-left: 20px">
      {#each node.children as child (child.id)}
        <svelte:self node={child} onReply={() => {}} />
      {/each}
    </ul>
  {/if}
</li>
