<script>
  // Props: activeNotes is a 2D boolean array
  export let activeNotes = [];
  export let rows = 8;
  export let columns = 16;
  /**
   * Emit an event when a note is toggled
   * @param {number} row
   * @param {number} col
   */
  const toggleNote = (row, col) => {
    const event = new CustomEvent('toggle', { detail: { row, col } });
    dispatchEvent(event);
  };
</script>

<!--
  This component will eventually render a canvas and handle hit testing.
  For the stub, we show a simple grid of buttons.
-->
<div class="grid" style="display: grid; grid-template-columns: repeat({columns}, 1fr); gap: 2px;">
  {#each Array(rows) as _, row}
    {#each Array(columns) as __, col}
      <button
        class="w-4 h-4 rounded-full border-0 focus:outline-none {activeNotes[row] && activeNotes[row][col] ? 'bg-accent' : 'bg-noteInactive'}"
        on:click={() => toggleNote(row, col)}
      ></button>
    {/each}
  {/each}
</div>

<style>
  .bg-accent {
    background-color: var(--accent);
  }
  .bg-noteInactive {
    background-color: var(--note-inactive);
  }
</style>