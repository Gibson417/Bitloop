<script>
  import { createEventDispatcher } from 'svelte';

  export let zoomLevel = 16;
  export const minZoom = 8;
  export const maxZoom = 64;
  export let trackColor = '#78d2b9';

  const dispatch = createEventDispatcher();

  // Valid resolution denominators: 8, 16, 32, 64 (range from 1/8 to 1/64)
  const VALID_RESOLUTIONS = [8, 16, 32, 64];

  // Get the display text for the current zoom level (resolution) - show denominator only
  $: displayResolution = `${zoomLevel}`;
  
  // Check if we're at the boundaries
  $: currentIndex = VALID_RESOLUTIONS.indexOf(zoomLevel);
  $: canZoomOut = currentIndex > 0;
  $: canZoomIn = currentIndex < VALID_RESOLUTIONS.length - 1;

  const handleZoomIn = () => {
    // Zoom in means finer resolution (higher denominator)
    const currentIndex = VALID_RESOLUTIONS.indexOf(zoomLevel);
    if (currentIndex < VALID_RESOLUTIONS.length - 1) {
      dispatch('zoom', { level: VALID_RESOLUTIONS[currentIndex + 1] });
    }
  };

  const handleZoomOut = () => {
    // Zoom out means coarser resolution (lower denominator)
    const currentIndex = VALID_RESOLUTIONS.indexOf(zoomLevel);
    if (currentIndex > 0) {
      dispatch('zoom', { level: VALID_RESOLUTIONS[currentIndex - 1] });
    }
  };
</script>

<div class="zoom-controls" data-component="ZoomControls">
  <svg class="grid-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
  </svg>
  <div class="zoom-buttons">
    <button
      type="button"
      class="zoom-btn"
      on:click={handleZoomOut}
      disabled={!canZoomOut}
      title="Zoom out (show less detail)"
      aria-label="Zoom out"
      style="border-color: {trackColor}33; color: {trackColor};"
    >
      −
    </button>
    <span class="zoom-level" style="color: {trackColor};">{displayResolution}</span>
    <button
      type="button"
      class="zoom-btn"
      on:click={handleZoomIn}
      disabled={!canZoomIn}
      title="Zoom in (show more detail)"
      aria-label="Zoom in"
      style="border-color: {trackColor}33; color: {trackColor};"
    >
      +
    </button>
  </div>
</div>

<style>
  .zoom-controls {
    display: flex;
    align-items: center;
    gap: 8px; /* Reduced from 10px, using 8px base */
    /* Background removed for cleaner toolbar integration */
  }

  .grid-icon {
    width: 18px;
    height: 18px;
    color: rgba(var(--color-accent-rgb), 0.8);
    flex-shrink: 0;
  }

  .zoom-buttons {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .zoom-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px; /* Reduced from 28px for more compact feel */
    height: 26px;
    padding: 0;
    background: transparent;
    border: 1px solid;
    border-radius: 6px;
    font-size: 1.1rem; /* Reduced from 1.2rem */
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    line-height: 1;
  }

  .zoom-btn:hover:not(:disabled) {
    background: rgba(var(--color-accent-rgb), 0.1);
    transform: scale(1.05);
  }

  .zoom-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .zoom-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .zoom-level {
    font-size: 0.8rem; /* Reduced from 0.85rem */
    font-weight: 600;
    min-width: 30px; /* Reduced from 32px */
    text-align: center;
  }
</style>
