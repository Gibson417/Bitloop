<script>
  import { createEventDispatcher } from 'svelte';
  import { colors } from '../lib/colorTokens.js';

  export let currentWindow = 0;
  export let totalWindows = 1;
  export let trackColor = colors.accent;

  const dispatch = createEventDispatcher();

  const handlePrevious = () => {
    if (currentWindow > 0) {
      dispatch('switch', { window: currentWindow - 1 });
    }
  };

  const handleNext = () => {
    if (currentWindow < totalWindows - 1) {
      dispatch('switch', { window: currentWindow + 1 });
    }
  };
</script>

<div class="window-switcher" role="navigation" aria-label="Grid window navigation" style="--track-color: {trackColor}" data-component="WindowSwitcher">
  <button
    type="button"
    class="window-nav-btn"
    on:click={handlePrevious}
    title="Previous window (Shift+Left)"
    aria-label="Previous window"
    disabled={currentWindow === 0}
    style="border-color: {trackColor}20; background: {trackColor}10;"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  </button>
  
  <div class="window-number" aria-label="Current window position" style="color: {trackColor};">
    {currentWindow + 1} / {totalWindows}
  </div>
  
  <button
    type="button"
    class="window-nav-btn"
    on:click={handleNext}
    title="Next window (Shift+Right)"
    aria-label="Next window"
    disabled={currentWindow >= totalWindows - 1}
    style="border-color: {trackColor}20; background: {trackColor}10;"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  </button>
</div>

<style>
  .window-switcher {
    display: flex;
    align-items: center;
    gap: 8px; /* Slightly increased from 6px for better spacing without dots */
    /* Background removed for cleaner toolbar integration */
    width: 140px; /* Fixed width for consistent layout */
    justify-content: space-between; /* Distribute items evenly */
  }

  .window-nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px; /* Reduced from 28px for consistency with zoom controls */
    height: 26px;
    padding: 0;
    border-radius: 6px;
    border: 1px solid rgba(var(--color-accent-rgb), 0.2); /* Reduced from 0.25 */
    background: rgba(var(--color-accent-rgb), 0.08); /* Reduced from 0.12 */
    color: rgba(var(--color-accent-rgb), 0.85); /* Reduced from 0.9 */
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
  }

  .window-nav-btn svg {
    width: 13px; /* Reduced from 14px */
    height: 13px;
  }

  .window-nav-btn:hover:not(:disabled) {
    background: rgba(var(--color-accent-rgb), 0.18); /* Reduced from 0.22 */
    border-color: rgba(var(--color-accent-rgb), 0.4); /* Reduced from 0.5 */
    color: #fff;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(var(--color-accent-rgb), 0.2); /* Reduced from 0.25 */
  }

  .window-nav-btn:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .window-nav-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .window-nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    color: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
  }

  .window-number {
    font-size: 0.75rem; /* Slightly increased from 0.68rem for better readability */
    font-weight: 600;
    letter-spacing: 0.02em;
    padding: 0 4px;
    opacity: 0.9; /* Increased from 0.85 for better visibility as primary indicator */
    min-width: 42px; /* Adjusted for better centering */
    text-align: center;
    flex: 1; /* Take available space between buttons */
  }

  @media (prefers-reduced-motion: reduce) {
    .window-nav-btn {
      transition: none;
      transform: none !important;
    }
  }

  @media (max-width: 560px) {
    .window-switcher {
      gap: 8px;
      padding: 6px 10px;
      width: auto; /* Allow flexible width on mobile */
      min-width: 160px; /* Ensure minimum usable width */
    }

    .window-nav-btn {
      width: 40px;
      height: 40px;
    }

    .window-nav-btn svg {
      width: 16px;
      height: 16px;
    }

    .window-number {
      font-size: 0.8rem;
      min-width: 50px;
    }
  }
</style>
