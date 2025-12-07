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

  const handleToggleGhost = (event, idx) => {
    event.stopPropagation();
    dispatch('toggleghost', { index: idx });
  };
</script>

<div class="track-selector" data-component="TrackSelector">
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
        <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      <button
        class="action-button"
        type="button"
        on:click={handleDuplicateTrack}
        disabled={!canAddMore()}
        aria-label="Duplicate track"
        title="Duplicate track"
      >
        <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
      <button
        class="action-button"
        type="button"
        on:click={handleDeleteTrack}
        disabled={tracks.length <= 1}
        aria-label="Delete track"
        title="Delete track"
      >
        <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
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
        
        <!-- Progressive disclosure: Controls only visible on hover/selection -->
        <div class="track-controls">
          <button
            type="button"
            class="toggle-btn mute {track.mute ? 'active' : ''}"
            aria-label={track.mute ? `Unmute ${track.name}` : `Mute ${track.name}`}
            aria-pressed={track.mute}
            title={track.mute ? 'Unmute' : 'Mute'}
            on:click={(event) => handleToggleMute(event, idx)}
          >
            <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              {#if track.mute}
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              {:else}
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              {/if}
            </svg>
          </button>
          <button
            type="button"
            class="toggle-btn solo {track.solo ? 'active' : ''}"
            aria-label={track.solo ? `Unsolo ${track.name}` : `Solo ${track.name}`}
            aria-pressed={track.solo}
            title={track.solo ? 'Unsolo' : 'Solo'}
            on:click={(event) => handleToggleSolo(event, idx)}
          >
            <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
            </svg>
          </button>
          <button
            type="button"
            class="toggle-btn ghost {track.ghostVisible ? 'active' : ''}"
            aria-label={track.ghostVisible ? `Hide ghost notes from ${track.name}` : `Show ghost notes from ${track.name}`}
            aria-pressed={track.ghostVisible}
            title={track.ghostVisible ? 'Hide ghost notes' : 'Show ghost notes'}
            on:click={(event) => handleToggleGhost(event, idx)}
          >
            <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
        
        {#if canRemoveTrack(idx)}
          <button
            type="button"
            class="remove-button"
            aria-label={`Remove ${track.name}`}
            on:click={(event) => handleRemoveTrack(event, idx)}
          >
            <svg class="remove-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  /* Design token-based spacing and sizing */
  .track-selector {
    display: flex;
    flex-direction: column;
    gap: 12px; /* spacing.sm */
  }

  .selector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 4px; /* spacing.xxs */
  }

  .selector-title {
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.75rem; /* typography.size.xs */
    color: var(--color-text-muted);
    font-weight: 600; /* typography.weight.semibold */
  }

  .header-actions {
    display: flex;
    gap: 8px; /* spacing.xs */
  }

  .action-button {
    min-width: 44px; /* components.touchTarget.minimum - WCAG 2.2 AA */
    min-height: 44px;
    border-radius: 8px; /* radius.md */
    border: 1px solid rgba(var(--color-accent-rgb), 0.4); /* opacity.strong */
    background: rgba(var(--color-accent-rgb), 0.15); /* opacity.muted */
    color: var(--color-accent);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 200ms ease; /* motion.duration.base */
    padding: 0;
  }

  .action-icon {
    width: 20px;
    height: 20px;
    display: block;
  }

  .action-button:hover:not(:disabled) {
    background: rgba(var(--color-accent-rgb), 0.25); /* opacity.medium */
    border-color: rgba(var(--color-accent-rgb), 0.7); /* opacity.intense */
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(var(--color-accent-rgb), 0.25);
    color: var(--color-text);
  }

  .action-button:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .action-button:disabled {
    opacity: 0.4; /* opacity.strong */
    cursor: not-allowed;
  }

  .track-list {
    display: flex;
    flex-direction: column;
    gap: 8px; /* spacing.xs - improved breathing room */
    max-height: 400px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(var(--color-accent-rgb), 0.4) transparent;
  }

  .track-list::-webkit-scrollbar {
    width: 6px;
  }

  .track-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .track-list::-webkit-scrollbar-thumb {
    background: rgba(var(--color-accent-rgb), 0.4);
    border-radius: 999px;
  }

  .track-list::-webkit-scrollbar-thumb:hover {
    background: rgba(var(--color-accent-rgb), 0.7);
  }

  .track-item {
    display: flex;
    align-items: center;
    padding: 12px; /* spacing.sm - improved padding */
    border-radius: 8px; /* radius.md */
    border: 1px solid rgba(255, 255, 255, 0.08); /* opacity.subtle */
    background: rgba(var(--color-background, 17, 20, 29), 0.5);
    color: var(--color-text);
    text-align: left;
    gap: 12px; /* spacing.sm - improved internal spacing */
    transition: all 200ms ease; /* motion.duration.base */
    position: relative;
    min-height: 56px; /* components.trackItem.minHeight */
  }

  .track-item:hover {
    border-color: rgba(var(--color-accent-rgb), 0.4);
    background: rgba(var(--color-background, 17, 20, 29), 0.85);
  }

  .track-item.selected {
    border-color: rgba(var(--color-accent-rgb), 0.7); /* opacity.intense */
    background: rgba(var(--color-accent-rgb), 0.15); /* opacity.muted */
    box-shadow: 0 4px 16px rgba(var(--color-accent-rgb), 0.25);
  }

  .track-strip {
    width: 4px; /* components.trackItem.stripWidth - more subtle */
    height: 100%;
    min-height: 32px;
    border-radius: 2px;
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
    min-height: 44px; /* Touch target for track selection */
    display: flex;
    align-items: center;
  }

  .track-main:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
    border-radius: 4px; /* radius.sm */
  }

  .track-info {
    display: flex;
    flex-direction: column;
    gap: 4px; /* spacing.xxs */
    flex: 1;
    overflow: hidden;
  }

  .track-name {
    font-weight: 600; /* typography.weight.semibold */
    font-size: 0.9rem;
    letter-spacing: 0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.25; /* typography.lineHeight.tight */
  }

  .track-meta {
    font-size: 0.75rem; /* typography.size.xs */
    text-transform: capitalize;
    color: var(--color-text-muted);
    line-height: 1.25;
  }

  /* Progressive disclosure - controls group */
  .track-controls {
    display: flex;
    gap: 4px; /* spacing.xxs */
    align-items: center;
    opacity: 0;
    transition: opacity 200ms ease;
  }

  .track-item:hover .track-controls,
  .track-item.selected .track-controls {
    opacity: 1;
  }

  .toggle-btn {
    min-width: 44px; /* components.touchTarget.minSize - WCAG 2.2 AA compliant */
    min-height: 44px;
    padding: 0; /* No padding needed with 44px size */
    border-radius: 4px; /* radius.sm - more subtle */
    border: 1px solid rgba(255, 255, 255, 0.15); /* opacity.muted */
    background: rgba(255, 255, 255, 0.08); /* opacity.subtle */
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 200ms ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .toggle-icon {
    width: 18px; /* components.trackItem.iconSize - smaller icons */
    height: 18px;
    display: block;
  }

  .toggle-btn:hover {
    border-color: rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.15);
    transform: scale(1.08);
  }

  .toggle-btn:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .toggle-btn.active {
    border-color: rgba(var(--color-accent-rgb), 0.7);
    background: rgba(var(--color-accent-rgb), 0.25);
    color: var(--color-text);
    box-shadow: 0 0 8px rgba(var(--color-accent-rgb), 0.3);
  }

  .toggle-btn.mute.active {
    border-color: rgba(255, 100, 100, 0.7);
    background: rgba(255, 100, 100, 0.25);
    box-shadow: 0 0 8px rgba(255, 100, 100, 0.3);
  }

  /* Remove button - only visible on hover, not when selected */
  .remove-button {
    min-width: 44px; /* components.touchTarget.minSize - WCAG 2.2 AA compliant */
    min-height: 44px;
    padding: 0; /* No padding needed with 44px size */
    border-radius: 4px; /* radius.sm */
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.08);
    color: var(--color-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 200ms ease;
    flex-shrink: 0;
    opacity: 0;
    visibility: hidden;
  }

  .track-item:hover .remove-button {
    opacity: 1;
    visibility: visible;
  }

  /* Don't show remove on selected tracks - keep focus on controls */
  .track-item.selected .remove-button {
    opacity: 0;
    visibility: hidden;
  }

  .remove-icon {
    width: 18px;
    height: 18px;
    display: block;
  }

  .remove-button:hover {
    background: rgba(255, 80, 80, 0.3);
    border-color: rgba(255, 80, 80, 0.5);
    color: var(--color-text);
    transform: scale(1.08);
  }

  .remove-button:focus-visible {
    outline: 2px solid rgba(255, 80, 80, 0.8);
    outline-offset: 2px;
    opacity: 1;
  }

  /* Accessibility: Respect user's motion preferences */
  @media (prefers-reduced-motion: reduce) {
    .track-controls,
    .remove-button,
    .toggle-btn,
    .track-item,
    .action-button {
      transition: none;
    }
    
    /* Disable hover transforms that create motion */
    .action-button:hover,
    .toggle-btn:hover,
    .remove-button:hover {
      transform: none;
    }
  }
</style>
