<script lang="ts">
  interface Todo {
    id: string;
    text: string;
  }

  let todos = $state<Todo[]>([]);
  let text = $state("");

  function add(e: SubmitEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    todos = [...todos, { id: crypto.randomUUID(), text: value }];
    text = "";
  }

  function remove(id: string) {
    todos = todos.filter((t) => t.id !== id);
  }
</script>

<main style="font-family: sans-serif; padding: 1rem; max-width: 420px">
  <h1>Todo List</h1>
  <form onsubmit={add} style="display: flex; gap: 8px">
    <input
      aria-label="New todo"
      placeholder="Add a todo"
      bind:value={text}
      style="flex: 1"
    />
    <button type="submit">Add</button>
  </form>
  <ul>
    {#each todos as t (t.id)}
      <li
        style="display: flex; justify-content: space-between; gap: 8px; padding: 4px 0"
      >
        <span>{t.text}</span>
        <button type="button" onclick={() => remove(t.id)}>Delete {t.text}</button>
      </li>
    {/each}
  </ul>
</main>
