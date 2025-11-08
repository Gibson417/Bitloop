<script>
  export let tracks = [];
  export let selected = 0;
  /**
   * Select a track by index
   * @param {number} idx
   */
  const selectTrack = (idx) => {
    const event = new CustomEvent('select', { detail: { index: idx } });
    dispatchEvent(event);
  };
</script>

<div class="flex space-x-2 p-2 bg-panel">
  {#each tracks as track, idx}
    <div
      class="flex items-center cursor-pointer px-3 py-1 rounded shadow-sm {idx === selected ? 'bg-accent' : 'bg-panel'}"
      on:click={() => selectTrack(idx)}
    >
      <div class="w-2 h-4 mr-2 rounded" style="background-color: {track.color || 'var(--accent)'}"></div>
      <span class="text-sm">{track.name}</span>
    </div>
  {/each}
</div>

<style>
  .bg-panel { background-color: var(--panel); }
  .bg-accent { background-color: var(--accent); color: #0e1016; }
</style>