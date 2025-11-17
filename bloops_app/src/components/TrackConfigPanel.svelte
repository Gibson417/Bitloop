<script>
  import { createEventDispatcher } from 'svelte';
  import TrackControls from './TrackControls.svelte';
  import TrackEffectsPanel from './TrackEffectsPanel.svelte';

  export let track = null;
  export let trackIndex = 0;

  const dispatch = createEventDispatcher();

  let activePanel = null; // null = both hidden, 'controls' = show controls, 'effects' = show effects

  const togglePanel = (panel) => {
    activePanel = activePanel === panel ? null : panel;
  };

  const handleUpdate = (event) => {
    dispatch('update', event.detail);
  };
</script>

{#if track}
  <div class="track-config-panel" data-component="TrackConfigPanel">
    <div class="panel-buttons">
      <button
        type="button"
        class={`panel-button ${activePanel === 'controls' ? 'active' : ''}`}
        on:click={() => togglePanel('controls')}
        aria-expanded={activePanel === 'controls'}
      >
        <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3"/>
          <line x1="12" y1="1" x2="12" y2="10"/>
          <line x1="12" y1="14" x2="12" y2="23"/>
          <circle cx="5" cy="19" r="3"/>
          <line x1="5" y1="10" x2="5" y2="16"/>
          <line x1="5" y1="22" x2="5" y2="23"/>
          <circle cx="19" cy="5" r="3"/>
          <line x1="19" y1="1" x2="19" y2="2"/>
          <line x1="19" y1="8" x2="19" y2="23"/>
        </svg>
        <span class="button-label">Track Settings</span>
        <span class="chevron" aria-hidden="true">{activePanel === 'controls' ? '▼' : '▶'}</span>
      </button>
      <button
        type="button"
        class={`panel-button ${activePanel === 'effects' ? 'active' : ''}`}
        on:click={() => togglePanel('effects')}
        aria-expanded={activePanel === 'effects'}
      >
        <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
        <span class="button-label">Sound Shaping</span>
        <span class="chevron" aria-hidden="true">{activePanel === 'effects' ? '▼' : '▶'}</span>
      </button>
    </div>

    {#if activePanel === 'controls'}
      <div class="panel-content">
        <TrackControls
          {track}
          {trackIndex}
          on:update={handleUpdate}
        />
      </div>
    {/if}

    {#if activePanel === 'effects'}
      <div class="panel-content">
        <TrackEffectsPanel
          {track}
          {trackIndex}
          on:update={handleUpdate}
        />
      </div>
    {/if}
  </div>
{/if}

<style>
  .track-config-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0;
  }

  .panel-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .panel-button {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 12px 20px;
    min-height: 48px;
    border-radius: 12px;
    border: 2px solid rgba(var(--color-text), 0.15);
    background: linear-gradient(135deg, var(--color-grid-bg), var(--color-grid-bg-end));
    color: var(--color-text-muted);
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    flex: 1 1 200px;
    justify-content: center;
  }

  .panel-button:hover,
  .panel-button:focus {
    outline: none;
    border-color: rgba(var(--color-accent-rgb), 0.4);
    background: linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.12), rgba(var(--color-accent-rgb), 0.08));
    color: var(--color-text);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .panel-button.active {
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.25), rgba(var(--color-accent-rgb), 0.18));
    color: var(--color-text);
    box-shadow: 0 6px 20px rgba(var(--color-accent-rgb), 0.3);
    transform: translateY(-2px);
  }

  .button-icon {
    width: 22px; /* Slightly larger for primary panel buttons */
    height: 22px;
    color: rgba(var(--color-accent-rgb), 0.8);
    flex-shrink: 0;
  }

  .button-label {
    flex: 1;
    text-align: center;
  }

  .chevron {
    font-size: 0.75rem;
    opacity: 0.7;
  }

  .panel-content {
    animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 640px) {
    .panel-buttons {
      flex-direction: column;
    }

    .panel-button {
      flex: 1 1 auto;
      width: 100%;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .panel-button {
      transition: none;
    }

    .panel-content {
      animation: none;
    }

    .panel-button:hover,
    .panel-button.active {
      transform: none;
    }
  }
</style>
