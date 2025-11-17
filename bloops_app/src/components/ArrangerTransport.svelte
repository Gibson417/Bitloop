<script>
  import { playback, startPlayback, stopPlayback } from '../store/arrangerStore.js';

  $: beatsPerBar = $playback.beatsPerBar ?? 4;
  $: currentBar = Math.floor(($playback.playheadBeat ?? 0) / beatsPerBar) + 1;
  $: currentBeat = Math.floor(($playback.playheadBeat ?? 0) % beatsPerBar) + 1;
  $: timeLabel = `${currentBar}:${currentBeat.toString().padStart(2, '0')}`;

  const togglePlayback = () => {
    if ($playback.isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };
</script>

<section class="transport">
  <div class="transport__controls">
    <button class="transport__button" type="button" on:click={togglePlayback}>
      {$playback.isPlaying ? 'Stop' : 'Play'}
    </button>
  </div>
  <div class="transport__time">
    <span class="transport__label">Arranger</span>
    <span class="transport__value">{timeLabel}</span>
  </div>
</section>

<style>
  .transport {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--color-panel);
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    gap: 16px;
  }

  .transport__controls {
    display: flex;
    gap: 12px;
  }

  .transport__button {
    background: var(--color-accent);
    color: var(--color-background);
    border: none;
    border-radius: 8px;
    padding: 8px 24px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: filter 120ms ease;
  }

  .transport__button:hover {
    filter: brightness(1.1);
  }

  .transport__time {
    display: flex;
    flex-direction: column;
    text-align: right;
  }

  .transport__label {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .transport__value {
    font-size: 1.2rem;
    font-weight: 600;
  }
</style>
