<script setup lang="ts">
import { ref } from "vue";

interface Comment {
  id: string;
  text: string;
  children: Comment[];
}

const props = defineProps<{
  node: Comment;
  onReply: (id: string, text: string) => void;
}>();

const open = ref(false);
const text = ref("");

function submit() {
  const value = text.value.trim();
  if (!value) return;
  props.onReply(props.node.id, value);
  text.value = "";
  open.value = false;
}
</script>

<template>
  <li>
    <span>{{ node.text }}</span>
    <button
      type="button"
      :aria-label="`Reply to ${node.text}`"
      @click="open = !open"
    >
      Reply
    </button>
    <form
      v-if="open"
      @submit.prevent="submit"
      style="display: inline-flex; gap: 4px; margin-left: 8px"
    >
      <input :aria-label="`Reply to ${node.text}`" v-model="text" />
      <button type="submit">Add</button>
    </form>
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
