<script>
  import { createEventDispatcher } from 'svelte';
  import { scales, parseCustomScale } from '../lib/scales.js';
  import ArrowSelector from './ArrowSelector.svelte';

  export let track = null;
  export let trackIndex = 0;

  const dispatch = createEventDispatcher();

  const waveformOptions = ['sine', 'square', 'triangle', 'sawtooth', 'noise', 'custom'];
  const scaleOptions = [...Object.keys(scales), 'custom'];
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

  let customScaleInput = '';
  let customScaleError = '';

  const handleChange = (key, value) => {
    dispatch('update', { index: trackIndex, key, value });
  };

  const handleScaleChange = (newScale) => {
    if (newScale === 'custom') {
      const defaultCustomScale = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      customScaleInput = defaultCustomScale.join(', ');
      handleChange('scale', 'custom');
      handleChange('customScale', defaultCustomScale);
    } else {
      handleChange('scale', newScale);
      handleChange('customScale', null);
    }
  };

  const handleCustomScaleInput = (event) => {
    const input = event.target.value;
    customScaleInput = input;
    const parsed = parseCustomScale(input);
    
    if (parsed) {
      customScaleError = '';
      handleChange('customScale', parsed);
    } else {
      customScaleError = 'Invalid scale. Use 0-11 separated by commas or spaces, must include 0.';
    }
  };

  $: {
    if (track?.scale === 'custom' && track?.customScale) {
      customScaleInput = track.customScale.join(', ');
      customScaleError = '';
    }
  }
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
      <ArrowSelector
        label="Waveform"
        options={waveformOptions}
        value={track.waveform}
        on:change={(event) => handleChange('waveform', event.detail.value)}
      />
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
      <ArrowSelector
        label="Scale"
        options={scaleOptions}
        value={track.scale}
        on:change={(event) => handleScaleChange(event.detail.value)}
      />
    </div>

    {#if track.scale === 'custom'}
      <div class="control plain">
        <label for={`custom-scale-${trackIndex}`}>Custom scale (0-11)</label>
        <input
          id={`custom-scale-${trackIndex}`}
          type="text"
          value={customScaleInput}
          on:input={handleCustomScaleInput}
          placeholder="0, 2, 4, 5, 7, 9, 11"
        />
        {#if customScaleError}
          <span class="error-message">{customScaleError}</span>
        {/if}
        <span class="help-text">Enter semitones (0-11) separated by commas. Must include 0 (root).</span>
      </div>
    {/if}

    <div class="control plain">
      <ArrowSelector
        label="Root note"
        options={rootNoteOptions}
        value={track.rootNote ?? 0}
        on:change={(event) => handleChange('rootNote', event.detail.value)}
      />
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

  .error-message {
    display: block;
    font-size: 0.7rem;
    color: #ff6b6b;
    margin-top: 4px;
  }

  .help-text {
    display: block;
    font-size: 0.68rem;
    color: rgba(255, 255, 255, 0.45);
    margin-top: 4px;
    line-height: 1.3;
  }

  @media (max-width: 720px) {
    .track-controls {
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    }
  }
</style>
