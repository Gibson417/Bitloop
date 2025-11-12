<script>
  import { createEventDispatcher } from 'svelte';

  export let playing = false;

  const dispatch = createEventDispatcher();

  const handlePlayClick = () => {
    dispatch('toggleplay');
  };

  const handleBackClick = () => {
    dispatch('skipback');
  };

  const handleSkipClick = () => {
    dispatch('skip');
  };

</script>

<div class="transport">
  <div class="transport-buttons">
    <button class="control-button" on:click={handleBackClick} type="button" aria-label="Skip to previous bar">
      <svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
      </svg>
    </button>
    <button 
      class="play-button" 
      class:active={playing} 
      on:click={handlePlayClick} 
      type="button" 
      aria-label={playing ? 'Stop' : 'Play'}
      aria-pressed={playing}
    >
      {#if playing}
        <svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1"/>
          <rect x="14" y="4" width="4" height="16" rx="1"/>
        </svg>
      {:else}
        <svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      {/if}
    </button>
    <button class="control-button" on:click={handleSkipClick} type="button" aria-label="Skip to next bar">
      <svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
      </svg>
    </button>
  </div>
</div>

<style>
  .transport {
    display: flex;
    flex-direction: column;
    gap: 24px;
    align-items: center;
  }

  .transport-buttons {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: center;
  }

  .play-button {
    width: 64px;
    height: 64px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    border: 2px solid rgba(var(--color-accent-rgb), 0.4);
    background: linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.22), rgba(22, 26, 36, 0.85));
    color: rgba(var(--color-accent-rgb), 0.95);
    font-size: 1.4rem;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease;
    box-shadow: 0 8px 24px rgba(var(--color-accent-rgb), 0.25);
  }

  .play-button .icon {
    width: 24px;
    height: 24px;
    display: block;
  }

  .control-button .icon {
    width: 20px;
    height: 20px;
    display: block;
  }

  .play-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(var(--color-accent-rgb), 0.3);
    color: #fff;
  }

  .play-button:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 3px;
  }

  .play-button.active {
    background: linear-gradient(135deg, rgba(var(--color-accent-bright-rgb), 0.35), rgba(22, 26, 36, 0.85));
    border-color: rgba(var(--color-accent-bright-rgb), 0.5);
    box-shadow: 0 8px 24px rgba(var(--color-accent-bright-rgb), 0.35);
    color: rgba(var(--color-accent-bright-rgb), 0.95);
  }

  .control-button {
    width: 48px;
    height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    border: 1px solid rgba(var(--color-accent-rgb), 0.35);
    background: rgba(var(--color-accent-rgb), 0.14);
    color: rgba(var(--color-accent-rgb), 0.95);
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .control-button:hover:not(:disabled) {
    transform: translateY(-1px);
    background: rgba(var(--color-accent-rgb), 0.24);
    border-color: rgba(var(--color-accent-rgb), 0.5);
    color: #fff;
    box-shadow: 0 6px 16px rgba(var(--color-accent-rgb), 0.25);
  }

  .control-button:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .control-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.12);
  }

  .control-button .icon {
    display: grid;
    place-items: center;
    font-size: 1.3rem;
  }

</style>
