<script>
  import { createEventDispatcher } from 'svelte';

  export let tracks = [];
  export let selected = 0;

  const dispatch = createEventDispatcher();

  const selectTrack = (idx) => {
    dispatch('select', { index: idx });
  };
</script>

<div class="flex flex-wrap gap-2 p-2 bg-panel">
  {#each tracks as track, idx}
    <button
      type="button"
      class="track"
      class:track--active={idx === selected}
      on:click={() => selectTrack(idx)}
    >
      <span class="indicator" style={`background-color: ${track.color || 'var(--accent)'}`}></span>
      <span class="label">{track.name}</span>
    </button>
  {/each}
</div>

<style>
  .track {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.75rem;
    background-color: var(--panel);
    color: white;
    border: 1px solid transparent;
    cursor: pointer;
    transition: transform 0.15s ease, background-color 0.15s ease;
  }

  .track:hover {
    transform: translateY(-1px);
  }

  .track:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .track--active {
    background-color: var(--accent);
    color: #0e1016;
  }

  .indicator {
    width: 0.35rem;
    height: 1.5rem;
    border-radius: 9999px;
  }

  .label {
    font-size: 0.875rem;
    font-weight: 500;
  }
</style>
