<script>
  import { createEventDispatcher } from 'svelte';

  export let playing = false;
  export let follow = true;

  const dispatch = createEventDispatcher();

  const handlePlayClick = () => {
    dispatch('toggleplay');
  };

  const handleFollowClick = () => {
    dispatch('togglefollow', { value: !follow });
  };
</script>

<div class="transport">
  <button class="play-button" class:active={playing} on:click={handlePlayClick} type="button" aria-label={playing ? 'Stop' : 'Play'}>
    <span class="icon" aria-hidden="true">{playing ? '■' : '▶'}</span>
  </button>
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

  .play-button {
    width: 64px;
    height: 64px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    border: 1px solid rgba(var(--color-accent-rgb), 0.32);
    background: linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.18), rgba(22, 26, 36, 0.85));
    color: #fff;
    font-size: 1.4rem;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 18px 40px rgba(var(--color-accent-rgb), 0.2);
  }

  .play-button .icon {
    display: grid;
    place-items: center;
    font-size: 1.6rem;
  }

  .play-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 22px 44px rgba(var(--color-accent-rgb), 0.28);
  }

  .play-button.active {
    background: linear-gradient(135deg, rgba(246, 142, 175, 0.25), rgba(22, 26, 36, 0.85));
    border-color: rgba(246, 142, 175, 0.32);
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
    padding: 10px 14px;
    border-radius: 12px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: color 0.2s ease;
    position: relative;
  }

  .follow:hover {
    color: #fff;
  }

  .follow .indicator {
    width: 36px;
    height: 20px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.18);
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
  }

  .follow.active .indicator {
    background: var(--color-accent);
  }

  .follow.active .indicator::after {
    transform: translateX(16px);
  }
</style>
