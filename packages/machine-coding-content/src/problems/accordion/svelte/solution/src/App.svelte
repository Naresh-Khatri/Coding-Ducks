<script lang="ts">
  const SECTIONS = [
    { id: "a", title: "Section A", body: "The body of section A." },
    { id: "b", title: "Section B", body: "The body of section B." },
    { id: "c", title: "Section C", body: "The body of section C." },
  ];

  let open = $state<Record<string, boolean>>({});
  function toggle(id: string) {
    open = { ...open, [id]: !open[id] };
  }
</script>

<main style="font-family: sans-serif; padding: 1rem; max-width: 420px">
  <h1>Accordion</h1>
  {#each SECTIONS as s (s.id)}
    <section style="border-bottom: 1px solid #ddd">
      <h2 style="margin: 0">
        <button
          type="button"
          aria-expanded={Boolean(open[s.id])}
          onclick={() => toggle(s.id)}
          style="width: 100%; text-align: left; padding: 10px 4px; background: none; border: none; font: inherit; cursor: pointer"
        >
          {s.title}
        </button>
      </h2>
      {#if open[s.id]}
        <div style="padding: 4px 4px 12px">{s.body}</div>
      {/if}
    </section>
  {/each}
</main>
