<script>
  import { createEventDispatcher } from 'svelte';

  export let playing = false;
  export let follow = true;
  export let bpm = 120;

  const dispatch = createEventDispatcher();

  const handlePlayClick = () => {
    dispatch('toggleplay');
  };

  const handleFollowClick = () => {
    dispatch('togglefollow', { value: !follow });
  };

  const handleBpmChange = (event) => {
    const value = Number(event.target.value);
    if (!Number.isNaN(value)) {
      dispatch('changebpm', { value });
    }
  };
</script>

<div class="transport">
  <button class="play-button" class:active={playing} on:click={handlePlayClick} type="button" aria-label={playing ? 'Stop' : 'Play'}>
    <span class="icon" aria-hidden="true">{playing ? '■' : '▶'}</span>
  </button>
  <div class="transport-controls">
    <button class="follow" class:active={follow} on:click={handleFollowClick} type="button">
      <span class="indicator" aria-hidden="true"></span>
      <span>Follow</span>
    </button>
    <label class="tempo">
      <span class="tempo-label">Tempo</span>
      <div class="tempo-field">
        <input type="number" min="30" max="260" value={bpm} on:input={handleBpmChange} />
        <span class="suffix">BPM</span>
      </div>
    </label>
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
    border-radius: 50%;
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
    font-size: 1.4rem;
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

  .tempo {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .tempo-label {
    font-weight: 600;
  }

  .tempo-field {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  .tempo-field input {
    appearance: textfield;
    width: 72px;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
    outline: none;
  }

  .tempo-field input::-webkit-outer-spin-button,
  .tempo-field input::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }

  .suffix {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.45);
    letter-spacing: 0.1em;
  }
</style>
