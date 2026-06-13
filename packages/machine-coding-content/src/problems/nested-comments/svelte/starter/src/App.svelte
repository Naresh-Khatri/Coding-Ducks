<script lang="ts">
  import CommentNode from "./CommentNode.svelte";

  interface Comment {
    id: string;
    text: string;
    children: Comment[];
  }

  const INITIAL: Comment[] = [
    {
      id: "1",
      text: "First comment",
      children: [{ id: "2", text: "A reply to the first", children: [] }],
    },
    { id: "3", text: "Second comment", children: [] },
  ];

  let tree = $state<Comment[]>(INITIAL);

  // TODO:
  //  - implement reply() so a non-empty reply is added as a child of `id`
  //  - the per-comment Reply box lives in CommentNode.svelte
  function reply(_id: string, _text: string) {
    // TODO: implement
  }
</script>

<main style="font-family: sans-serif; padding: 1rem">
  <h1>Nested Comments</h1>
  <ul>
    {#each tree as c (c.id)}
      <CommentNode node={c} onReply={reply} />
    {/each}
  </ul>
</main>
