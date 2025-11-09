<script>
  import { createEventDispatcher } from 'svelte';

  export let playing = false;
  export let follow = true;

  const dispatch = createEventDispatcher();

  const handlePlayClick = () => {
    dispatch('toggleplay');
  };

  const handlePauseClick = () => {
    dispatch('pause');
  };

  const handleSkipClick = () => {
    dispatch('skip');
  };

  const handleFollowClick = () => {
    dispatch('togglefollow', { value: !follow });
  };
</script>

<div class="transport">
  <div class="transport-buttons">
    <button class="play-button" class:active={playing} on:click={handlePlayClick} type="button" aria-label={playing ? 'Stop' : 'Play'}>
      <span class="icon" aria-hidden="true">{playing ? '■' : '▶'}</span>
    </button>
    <button class="control-button" on:click={handlePauseClick} type="button" aria-label="Pause" disabled={!playing}>
      <span class="icon" aria-hidden="true">⏸</span>
    </button>
    <button class="control-button" on:click={handleSkipClick} type="button" aria-label="Skip to next bar">
      <span class="icon" aria-hidden="true">⏭</span>
    </button>
  </div>
  <div class="transport-controls">
    <button class="follow" class:active={follow} on:click={handleFollowClick} type="button">
      <span>Follow</span>
      <span class="indicator" aria-hidden="true"></span>
    </button>
  </div>
</div>

<style>
  .transport {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .transport-buttons {
    display: flex;
    gap: 12px;
    align-items: center;
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
    color: #fff;
    font-size: 1.4rem;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    box-shadow: 0 16px 36px rgba(var(--color-accent-rgb), 0.25);
  }

  .play-button .icon {
    display: grid;
    place-items: center;
    font-size: 1.5rem;
  }

  .play-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 40px rgba(var(--color-accent-rgb), 0.28);
  }

  .play-button.active {
    background: linear-gradient(135deg, rgba(246, 142, 175, 0.25), rgba(22, 26, 36, 0.85));
    border-color: rgba(246, 142, 175, 0.32);
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

  .control-button:disabled {
    opacity: 0.35;
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

  .transport-controls {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .follow {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid rgba(var(--color-accent-rgb), 0.35);
    background: rgba(var(--color-accent-rgb), 0.14);
    color: rgba(var(--color-accent-rgb), 0.95);
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .follow:hover {
    color: #fff;
    background: rgba(var(--color-accent-rgb), 0.24);
    border-color: rgba(var(--color-accent-rgb), 0.5);
  }

  .follow .indicator {
    width: 36px;
    height: 20px;
    border-radius: 10px;
    background: rgba(var(--color-accent-rgb), 0.2);
    position: relative;
    transition: background 0.3s ease;
    flex-shrink: 0;
  }

  .follow .indicator::after {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    top: 2px;
    left: 2px;
    transition: transform 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .follow.active {
    color: #fff;
    border-color: rgba(var(--color-accent-rgb), 0.55);
    background: rgba(var(--color-accent-rgb), 0.22);
  }

  .follow.active .indicator {
    background: var(--color-accent);
  }

  .follow.active .indicator::after {
    transform: translateX(16px);
  }
</style>
