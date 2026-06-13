<script setup lang="ts">
interface Comment {
  id: string;
  text: string;
  children: Comment[];
}

defineProps<{
  node: Comment;
  onReply: (id: string, text: string) => void;
}>();

// TODO:
//  - a Reply button (aria-label `Reply to {text}`) toggles an input + Add button
//  - submitting a non-empty reply calls onReply(node.id, value)
</script>

<template>
  <li>
    <span>{{ node.text }}</span>
    <button type="button" :aria-label="`Reply to ${node.text}`">Reply</button>
    <ul v-if="node.children.length > 0" style="padding-left: 20px">
      <CommentNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :on-reply="onReply"
      />
    </ul>
  </li>
</template>
