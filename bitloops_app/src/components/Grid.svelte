<script>
  import { createEventDispatcher } from 'svelte';

  export let activeNotes = [];
  export let rows = 8;
  export let columns = 16;

  const dispatch = createEventDispatcher();

  const toggleNote = (row, col) => {
    dispatch('toggle', { row, col });
  };
</script>

<div class="grid" style={`grid-template-columns: repeat(${columns}, minmax(0, 1fr));`}>
  {#each Array.from({ length: rows }) as _, row}
    {#each Array.from({ length: columns }) as __, col}
      <button
        class="cell"
        class:bg-accent={activeNotes[row]?.[col]}
        class:bg-noteInactive={!activeNotes[row]?.[col]}
        on:click={() => toggleNote(row, col)}
        aria-pressed={activeNotes[row]?.[col] ? 'true' : 'false'}
      ></button>
    {/each}
  {/each}
</div>

<style>
  .grid {
    display: grid;
    gap: 0.5rem;
  }

  .cell {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 9999px;
    border: none;
    cursor: pointer;
    transition: transform 0.1s ease;
  }

  .cell:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .cell:hover {
    transform: scale(1.05);
  }

  .bg-accent {
    background-color: var(--accent);
  }

  .bg-noteInactive {
    background-color: var(--note-inactive);
  }
</style>
