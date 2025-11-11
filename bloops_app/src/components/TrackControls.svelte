<script>
  import { createEventDispatcher } from 'svelte';
  import { scales } from '../lib/scales.js';

  export let track = null;
  export let trackIndex = 0;

  const dispatch = createEventDispatcher();

  const waveformOptions = ['sine', 'square', 'triangle', 'sawtooth', 'noise', 'custom'];
  const scaleOptions = Object.keys(scales);
  const rootNoteOptions = [
    { value: 0, label: 'C' },
    { value: 1, label: 'C♯/D♭' },
    { value: 2, label: 'D' },
    { value: 3, label: 'D♯/E♭' },
    { value: 4, label: 'E' },
    { value: 5, label: 'F' },
    { value: 6, label: 'F♯/G♭' },
    { value: 7, label: 'G' },
    { value: 8, label: 'G♯/A♭' },
    { value: 9, label: 'A' },
    { value: 10, label: 'A♯/B♭' },
    { value: 11, label: 'B' }
  ];

  const handleChange = (key, value) => {
    dispatch('update', { index: trackIndex, key, value });
  };
</script>

{#if track}
  <div class="track-controls">
    <div class="control plain">
      <label for={`track-name-${trackIndex}`}>Track name</label>
      <div class="name-color-group">
        <input
          id={`track-color-${trackIndex}`}
          type="color"
          value={track.color}
          on:input={(event) => handleChange('color', event.target.value)}
          title="Track color"
          aria-label="Track color"
        />
        <input
          id={`track-name-${trackIndex}`}
          type="text"
          value={track.name}
          on:change={(event) => handleChange('name', event.target.value)}
        />
      </div>
    </div>

    <div class="control plain">
      <label for={`waveform-${trackIndex}`}>Waveform</label>
      <select
        id={`waveform-${trackIndex}`}
        on:change={(event) => handleChange('waveform', event.target.value)}
        value={track.waveform}
      >
        {#each waveformOptions as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
    </div>

    {#if track.waveform === 'custom'}
      <div class="control slider-control">
        <label for={`custom-shape-${trackIndex}`}>Custom shape</label>
        <div class="slider-field">
          <input
            id={`custom-shape-${trackIndex}`}
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={track.customShape ?? 0.5}
            on:input={(event) => handleChange('customShape', Number(event.target.value))}
          />
          <span>{Math.round((track.customShape ?? 0.5) * 100)}%</span>
        </div>
      </div>
    {/if}

    <div class="control plain">
      <label for={`scale-${trackIndex}`}>Scale</label>
      <select
        id={`scale-${trackIndex}`}
        on:change={(event) => handleChange('scale', event.target.value)}
        value={track.scale}
      >
        {#each scaleOptions as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
    </div>

    <div class="control plain">
      <label for={`root-note-${trackIndex}`}>Root note</label>
      <select
        id={`root-note-${trackIndex}`}
        on:change={(event) => handleChange('rootNote', Number(event.target.value))}
        value={track.rootNote ?? 0}
      >
        {#each rootNoteOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>

    <div class="control plain">
      <label for={`octave-${trackIndex}`}>Octave</label>
      <div class="number-field">
        <input
          id={`octave-${trackIndex}`}
          type="number"
          min="1"
          max="7"
          value={track.octave}
          on:change={(event) => handleChange('octave', Number(event.target.value))}
        />
      </div>
    </div>
  </div>
{/if}

<style>
  .track-controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 18px;
    padding: 18px;
    border-radius: 18px;
    background: linear-gradient(135deg, rgba(18, 22, 30, 0.9), rgba(10, 12, 16, 0.92));
    border: 1px solid rgba(255, 255, 255, 0.04);
    box-sizing: border-box;
  }

  .control {
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: #fff;
    font-size: 0.78rem;
  }

  .control.plain {
    background: transparent;
    border: none;
    padding: 0;
  }

  .control:not(.plain) {
    padding: 12px;
    border-radius: 14px;
    background: rgba(0, 0, 0, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .control label {
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.75);
  }

  .name-color-group {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .name-color-group input[type='text'] {
    flex: 1;
    min-width: 0;
  }

  .name-color-group input[type='color'] {
    width: 48px;
    height: 36px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    padding: 0;
    background: none;
    cursor: pointer;
    flex-shrink: 0;
  }

  .name-color-group input[type='color']:hover {
    border-color: rgba(var(--color-accent-rgb), 0.5);
  }

  select,
  input[type='number'],
  input[type='range'],
  input[type='text'] {
    background: rgba(0, 0, 0, 0.35);
    color: #fff;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 8px 12px;
    font-size: 0.95rem;
    width: 100%;
  }

  select:focus,
  input[type='number']:focus,
  input[type='range']:focus,
  input[type='text']:focus {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.5);
    outline-offset: 2px;
  }

  .slider-control {
    grid-column: 1 / -1;
  }

  .slider-field {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .slider-field input[type='range'] {
    flex: 1;
  }

  .slider-field span {
    font-size: 0.8rem;
    letter-spacing: 0.06em;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.75);
    white-space: nowrap;
    min-width: 60px;
    text-align: right;
  }

  .number-field input {
    width: 72px;
    text-align: center;
    font-weight: 600;
    appearance: textfield;
  }

  .number-field input::-webkit-outer-spin-button,
  .number-field input::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }

  @media (max-width: 720px) {
    .track-controls {
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    }
  }
</style>
