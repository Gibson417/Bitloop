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

  const handleDuplicateTrack = () => {
    dispatch('duplicate', { index: selected });
  };

  const handleDeleteTrack = () => {
    if (tracks.length <= 1) return;
    dispatch('remove', { index: selected });
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
    <div class="header-actions">
      <button
        class="action-button"
        type="button"
        on:click={handleAddTrack}
        disabled={!canAddMore()}
        aria-label="Add track"
        title="Add track"
      >
        +
      </button>
      <button
        class="action-button"
        type="button"
        on:click={handleDuplicateTrack}
        disabled={!canAddMore()}
        aria-label="Duplicate track"
        title="Duplicate track"
      >
        ⎘
      </button>
      <button
        class="action-button"
        type="button"
        on:click={handleDeleteTrack}
        disabled={tracks.length <= 1}
        aria-label="Delete track"
        title="Delete track"
      >
        🗑
      </button>
    </div>
  </div>
  <div class="track-list" role="tablist" aria-label="Tracks">
    {#each tracks as track, idx}
      <div
        class="track-item {idx === selected ? 'selected' : ''}"
      >
        <span class="track-strip" style={`background:${track.color}`}></span>
        <button
          type="button"
          class="track-main" 
          on:click={() => handleSelect(idx)} 
          aria-label={`${track.name} ${track.waveform}${idx === selected ? ', selected' : ''}`}
          aria-current={idx === selected ? 'true' : undefined}
        >
          <span class="track-info">
            <span class="track-name">{track.name}</span>
            <span class="track-meta">{track.waveform}</span>
          </span>
        </button>
        <button
          type="button"
          class="toggle-btn mute {track.mute ? 'active' : ''}"
          aria-label={track.mute ? `Unmute ${track.name}` : `Mute ${track.name}`}
          aria-pressed={track.mute}
          title={track.mute ? 'Unmute' : 'Mute'}
          on:click={(event) => handleToggleMute(event, idx)}
        >
          M
        </button>
        <button
          type="button"
          class="toggle-btn solo {track.solo ? 'active' : ''}"
          aria-label={track.solo ? `Unsolo ${track.name}` : `Solo ${track.name}`}
          aria-pressed={track.solo}
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
      </div>
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
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 700;
  }

  .header-actions {
    display: flex;
    gap: 6px;
  }

  .action-button {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    border: 1px solid rgba(var(--color-accent-rgb), 0.4);
    background: rgba(var(--color-accent-rgb), 0.15);
    color: var(--color-accent);
    font-size: 1.2rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .action-button:hover:not(:disabled) {
    background: rgba(var(--color-accent-rgb), 0.25);
    border-color: rgba(var(--color-accent-rgb), 0.6);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(var(--color-accent-rgb), 0.2);
  }

  .action-button:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .action-button:disabled {
    opacity: 0.4;
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
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(17, 20, 29, 0.5);
    color: #fff;
    text-align: left;
    gap: 8px;
    transition: all 0.2s ease;
    position: relative;
    min-height: 48px;
  }

  .track-item:hover {
    border-color: rgba(var(--color-accent-rgb), 0.4);
    background: rgba(17, 20, 29, 0.85);
    transform: translateY(-1px);
  }

  .track-item.selected {
    border-color: rgba(var(--color-accent-rgb), 0.7);
    background: rgba(var(--color-accent-rgb), 0.12);
    box-shadow: 0 4px 16px rgba(var(--color-accent-rgb), 0.2);
  }

  .track-strip {
    width: 6px;
    height: 100%;
    min-height: 32px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .track-main {
    flex: 1;
    cursor: pointer;
    min-width: 0;
    background: transparent;
    border: none;
    color: inherit;
    font: inherit;
    padding: 0;
    text-align: left;
  }

  .track-main:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
    border-radius: 6px;
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
    font-size: 0.75rem;
    text-transform: capitalize;
    color: rgba(255, 255, 255, 0.6);
  }

  .toggle-btn {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.8);
    font-weight: 700;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .toggle-btn:hover {
    border-color: rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.12);
    transform: scale(1.05);
  }

  .toggle-btn:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .toggle-btn.active {
    border-color: rgba(var(--color-accent-rgb), 0.7);
    background: rgba(var(--color-accent-rgb), 0.25);
    color: #fff;
    box-shadow: 0 0 8px rgba(var(--color-accent-rgb), 0.3);
  }

  .toggle-btn.mute.active {
    border-color: rgba(255, 100, 100, 0.7);
    background: rgba(255, 100, 100, 0.25);
    box-shadow: 0 0 8px rgba(255, 100, 100, 0.3);
  }

  .remove-button {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.2rem;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .remove-button:hover {
    background: rgba(255, 80, 80, 0.3);
    border-color: rgba(255, 80, 80, 0.5);
    color: #fff;
    transform: scale(1.05);
  }

  .remove-button:focus-visible {
    outline: 2px solid rgba(255, 80, 80, 0.8);
    outline-offset: 2px;
  }
</style>
