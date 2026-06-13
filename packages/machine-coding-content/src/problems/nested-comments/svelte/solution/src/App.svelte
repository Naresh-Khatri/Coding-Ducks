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

  let counter = 0;
  const makeComment = (text: string): Comment => ({
    id: "c" + ++counter,
    text,
    children: [],
  });

  function addReply(
    nodes: Comment[],
    parentId: string,
    text: string,
  ): Comment[] {
    return nodes.map((n) =>
      n.id === parentId
        ? { ...n, children: [...n.children, makeComment(text)] }
        : { ...n, children: addReply(n.children, parentId, text) },
    );
  }

  let tree = $state<Comment[]>(INITIAL);
  function reply(id: string, text: string) {
    tree = addReply(tree, id, text);
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
