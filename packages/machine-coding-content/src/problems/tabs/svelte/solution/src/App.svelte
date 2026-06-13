<script lang="ts">
  const TABS = [
    { id: "html", label: "HTML", content: "HyperText Markup Language" },
    { id: "css", label: "CSS", content: "Cascading Style Sheets" },
    { id: "js", label: "JS", content: "JavaScript, the language of the web" },
  ];

  let active = $state(TABS[0].id);
  const current = $derived(TABS.find((t) => t.id === active) ?? TABS[0]);
</script>

<main style="font-family: sans-serif; padding: 1rem">
  <h1>Tabs</h1>
  <div role="tablist" style="display: flex; gap: 4px">
    {#each TABS as t (t.id)}
      <button
        type="button"
        role="tab"
        aria-selected={t.id === active}
        onclick={() => (active = t.id)}
        style="padding: 6px 12px; border: 1px solid #ccc; border-bottom: {t.id ===
        active
          ? '2px solid #3178c6'
          : '1px solid #ccc'}; background: {t.id === active
          ? '#eef4fb'
          : '#fff'}; cursor: pointer"
      >
        {t.label}
      </button>
    {/each}
  </div>
  <div role="tabpanel" style="padding-top: 8px">{current.content}</div>
</main>
