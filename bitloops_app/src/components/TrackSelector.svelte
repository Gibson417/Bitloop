<script>
  import { createEventDispatcher } from 'svelte';

  export let tracks = [];
  export let selected = 0;
  export let maxTracks = 10;

  const canAddMore = () => tracks.length < maxTracks;
  const canRemoveTrack = (index) => tracks.length > 1 && index >= 0 && index < tracks.length;

  const dispatch = createEventDispatcher();

  const handleSelect = (idx) => {
    dispatch('select', { index: idx });
  };

  const handleAddTrack = () => {
    if (!canAddMore()) return;
    dispatch('add');
  };

  const handleRemoveTrack = (event, idx) => {
    event.stopPropagation();
    if (!canRemoveTrack(idx)) return;
    dispatch('remove', { index: idx });
  };

  const handleToggleMute = (event, idx) => {
    event.stopPropagation();
    dispatch('togglemute', { index: idx });
  };

  const handleToggleSolo = (event, idx) => {
    event.stopPropagation();
    dispatch('togglesolo', { index: idx });
  };
</script>

<div class="track-selector">
  <div class="selector-header">
    <span class="selector-title">Tracks</span>
    <button
      class="add-button"
      type="button"
      on:click={handleAddTrack}
      disabled={!canAddMore()}
      aria-label="Add track"
      title="Add track"
    >
      +
    </button>
  </div>
  <div class="track-list" role="tablist" aria-label="Tracks">
    {#each tracks as track, idx}
      <button
        class="track-item {idx === selected ? 'selected' : ''}"
        on:click={() => handleSelect(idx)}
        type="button"
        role="tab"
        aria-selected={idx === selected}
      >
        <span class="track-strip" style={`background:${track.color}`}></span>
        <span class="track-info">
          <span class="track-name">{track.name}</span>
          <span class="track-meta">{track.waveform}</span>
        </span>
        <button
          type="button"
          class="toggle-btn mute {track.mute ? 'active' : ''}"
          aria-label={track.mute ? `Unmute ${track.name}` : `Mute ${track.name}`}
          title={track.mute ? 'Unmute' : 'Mute'}
          on:click={(event) => handleToggleMute(event, idx)}
        >
          M
        </button>
        <button
          type="button"
          class="toggle-btn solo {track.solo ? 'active' : ''}"
          aria-label={track.solo ? `Unsolo ${track.name}` : `Solo ${track.name}`}
          title={track.solo ? 'Unsolo' : 'Solo'}
          on:click={(event) => handleToggleSolo(event, idx)}
        >
          S
        </button>
        {#if canRemoveTrack(idx)}
          <button
            type="button"
            class="remove-button"
            aria-label={`Remove ${track.name}`}
            on:click={(event) => handleRemoveTrack(event, idx)}
          >
            ×
          </button>
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .track-selector {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .selector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 4px;
  }

  .selector-title {
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 600;
  }

  .add-button {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid rgba(var(--color-accent-rgb), 0.3);
    background: rgba(var(--color-accent-rgb), 0.1);
    color: var(--color-accent);
    font-size: 1.2rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .add-button:hover:not(:disabled) {
    background: rgba(var(--color-accent-rgb), 0.2);
    border-color: rgba(var(--color-accent-rgb), 0.5);
  }

  .add-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .track-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 400px;
    overflow-y: auto;
    scrollbar-width: thin;
  }

  .track-list::-webkit-scrollbar {
    width: 6px;
  }

  .track-list::-webkit-scrollbar-thumb {
    background: rgba(var(--color-accent-rgb), 0.3);
    border-radius: 999px;
  }

  .track-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(17, 20, 29, 0.6);
    color: #fff;
    text-align: left;
    gap: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .track-item:hover {
    border-color: rgba(var(--color-accent-rgb), 0.3);
    background: rgba(17, 20, 29, 0.8);
  }

  .track-item.selected {
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: rgba(var(--color-accent-rgb), 0.08);
    box-shadow: 0 4px 12px rgba(var(--color-accent-rgb), 0.15);
  }

  .track-strip {
    width: 8px;
    height: 100%;
    min-height: 36px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .track-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    overflow: hidden;
  }

  .track-name {
    font-weight: 600;
    font-size: 0.9rem;
    letter-spacing: 0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .track-meta {
    font-size: 0.7rem;
    text-transform: capitalize;
    color: rgba(255, 255, 255, 0.5);
  }

  .toggle-btn {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.7);
    font-weight: 700;
    font-size: 0.7rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .toggle-btn:hover {
    border-color: rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.08);
  }

  .toggle-btn.active {
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: rgba(var(--color-accent-rgb), 0.2);
    color: #fff;
  }

  .toggle-btn.mute.active {
    border-color: rgba(255, 100, 100, 0.6);
    background: rgba(255, 100, 100, 0.2);
  }

  .remove-button {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: none;
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.1rem;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .remove-button:hover {
    background: rgba(255, 80, 80, 0.25);
    color: #fff;
  }
</style>
