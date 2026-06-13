<script setup lang="ts">
import { ref } from "vue";

import CommentNode from "./CommentNode.vue";

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

const tree = ref<Comment[]>(INITIAL);
function reply(id: string, text: string) {
  tree.value = addReply(tree.value, id, text);
}
</script>

<template>
  <main style="font-family: sans-serif; padding: 1rem">
    <h1>Nested Comments</h1>
    <ul>
      <CommentNode
        v-for="c in tree"
        :key="c.id"
        :node="c"
        :on-reply="reply"
      />
    </ul>
  </main>
</template>
