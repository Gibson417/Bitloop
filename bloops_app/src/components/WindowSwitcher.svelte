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

  const handleWindowClick = (index) => {
    dispatch('switch', { window: index });
  };
</script>

<div class="window-switcher" role="navigation" aria-label="Grid window navigation" style="--track-color: {trackColor}" data-component="WindowSwitcher">
  <button
    type="button"
    class="window-nav-btn"
    on:click={handlePrevious}
    title="Previous window (Shift+Left)"
    aria-label="Previous window"
    style="border-color: {trackColor}20; background: {trackColor}10;"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  </button>
  
  <div class="window-indicators" role="tablist" aria-label="Grid windows">
    {#each Array(totalWindows) as _, index}
      <button
        type="button"
        role="tab"
        class="window-indicator"
        class:active={index === currentWindow}
        on:click={() => handleWindowClick(index)}
        aria-label="Window {index + 1}"
        aria-selected={index === currentWindow}
        title="Window {index + 1}"
      >
        <span class="sr-only">Window {index + 1}</span>
      </button>
    {/each}
  </div>
  
  <div class="window-number" aria-label="Current window position" style="color: {trackColor};">
    {currentWindow + 1} / {totalWindows}
  </div>
  
  <button
    type="button"
    class="window-nav-btn"
    on:click={handleNext}
    title="Next window (Shift+Right)"
    aria-label="Next window"
    style="border-color: {trackColor}20; background: {trackColor}10;"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  </button>
</div>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .window-switcher {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    border-radius: 6px;
    background: linear-gradient(145deg, rgba(var(--color-accent-rgb), 0.08), rgba(34, 38, 50, 0.6));
    border: 1px solid rgba(var(--color-accent-rgb), 0.2);
  }

  .window-nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border-radius: 6px;
    border: 1px solid rgba(var(--color-accent-rgb), 0.25);
    background: rgba(var(--color-accent-rgb), 0.12);
    color: rgba(var(--color-accent-rgb), 0.9);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
  }

  .window-nav-btn svg {
    width: 18px;
    height: 18px;
  }

  .window-nav-btn:hover:not(:disabled) {
    background: rgba(var(--color-accent-rgb), 0.22);
    border-color: rgba(var(--color-accent-rgb), 0.5);
    color: #fff;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(var(--color-accent-rgb), 0.25);
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

  .window-indicators {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 0 4px;
  }

  .window-number {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    padding: 0 4px;
    opacity: 0.9;
    min-width: 36px;
    text-align: center;
  }

  .window-indicator {
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    border-radius: 50%;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .window-indicator::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .window-indicator:hover::before {
    transform: scale(1.3);
    box-shadow: 0 2px 8px rgba(var(--color-accent-rgb), 0.4);
    background: rgba(255, 255, 255, 0.3);
  }

  .window-indicator:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 3px;
  }

  .window-indicator.active::before {
    width: 10px;
    height: 10px;
    background: var(--track-color, rgba(var(--color-accent-rgb), 0.9));
    box-shadow: 0 2px 12px rgba(var(--color-accent-rgb), 0.6);
  }

  @media (prefers-reduced-motion: reduce) {
    .window-nav-btn,
    .window-indicator {
      transition: none;
      transform: none !important;
    }
  }

  @media (max-width: 560px) {
    .window-switcher {
      gap: 6px;
      padding: 4px 6px;
    }

    .window-indicators {
      gap: 4px;
    }
  }
</style>
