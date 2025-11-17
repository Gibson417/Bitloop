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

<section class="transport" aria-label="Pattern Arranger Transport Controls">
  <div class="transport__controls">
    <button 
      class="transport__button" 
      type="button" 
      on:click={togglePlayback}
      aria-label={$playback.isPlaying ? 'Stop playback' : 'Play arrangement'}
      aria-pressed={$playback.isPlaying}
    >
      {$playback.isPlaying ? 'Stop' : 'Play'}
    </button>
  </div>
  <div class="transport__time" aria-live="polite" aria-atomic="true">
    <span class="transport__label">Arranger</span>
    <span class="transport__value" aria-label={`Bar ${currentBar}, beat ${currentBeat}`}>{timeLabel}</span>
  </div>
</section>

<style>
  .transport {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--color-panel);
    padding: 12px 16px;
    border-radius: 8px;
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
    padding: 12px 24px;
    min-height: 44px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: filter 150ms ease, transform 150ms ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .transport__button:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  .transport__button:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .transport__button:active {
    transform: translateY(0) scale(0.98);
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

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .transport__button {
      transition: none;
    }

    .transport__button:hover,
    .transport__button:active {
      transform: none;
    }
  }
</style>
