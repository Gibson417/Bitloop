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
  <button class="play-button" class:active={playing} on:click={handlePlayClick} type="button">
    <span class="icon" aria-hidden="true">{playing ? '■' : '▶'}</span>
    <span class="label">{playing ? 'Stop' : 'Play'}</span>
  </button>
  <div class="transport-controls">
    <button class="follow" class:active={follow} on:click={handleFollowClick} type="button">
      <span class="indicator" aria-hidden="true"></span>
      <span>{follow ? 'Following' : 'Follow'}</span>
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 16px 20px;
    border-radius: 18px;
    border: 1px solid rgba(var(--color-accent-rgb), 0.32);
    background: linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.18), rgba(22, 26, 36, 0.85));
    color: #fff;
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 18px 40px rgba(var(--color-accent-rgb), 0.2);
  }

  .play-button .icon {
    width: 24px;
    height: 24px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.4);
    font-size: 0.9rem;
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
    gap: 10px;
    padding: 10px 14px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease;
  }

  .follow .indicator {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
    box-shadow: 0 0 0 0 rgba(var(--color-accent-rgb), 0.35);
    transition: background 0.2s ease, box-shadow 0.2s ease;
  }

  .follow.active {
    border-color: rgba(var(--color-accent-rgb), 0.5);
    background: rgba(var(--color-accent-rgb), 0.16);
    color: #fff;
  }

  .follow.active .indicator {
    background: var(--color-accent);
    box-shadow: 0 0 12px rgba(var(--color-accent-rgb), 0.6);
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
