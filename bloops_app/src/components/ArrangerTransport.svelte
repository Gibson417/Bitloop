<script>
  import { playback, startPlayback, stopPlayback } from '../store/arrangerStore.js';
  import { colors, spacing, radius, typography } from '../lib/colorTokens.js';

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
    background: {colors.panel};
    padding: {spacing.sm} {spacing.md};
    border-radius: {radius.lg};
    border: 1px solid rgba(255, 255, 255, 0.08);
    gap: {spacing.md};
  }

  .transport__controls {
    display: flex;
    gap: {spacing.sm};
  }

  .transport__button {
    background: {colors.accent};
    color: {colors.background};
    border: none;
    border-radius: {radius.md};
    padding: {spacing.xs} {spacing.lg};
    font-size: {typography.size.sm};
    font-weight: {typography.weight.semibold};
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
    font-size: {typography.size.xs};
    letter-spacing: {typography.letterSpacing.wide};
    text-transform: uppercase;
  }

  .transport__value {
    font-size: {typography.size.lg};
    font-weight: {typography.weight.semibold};
  }
</style>
