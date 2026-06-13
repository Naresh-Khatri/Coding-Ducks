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

const tree = ref<Comment[]>(INITIAL);

// TODO:
//  - implement reply() so a non-empty reply is added as a child of `id`
//  - the per-comment Reply box lives in CommentNode.vue
function reply(_id: string, _text: string) {
  // TODO: implement
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
