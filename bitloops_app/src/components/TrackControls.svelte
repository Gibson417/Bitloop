<script>
  import { createEventDispatcher } from 'svelte';
  import { scales } from '../lib/scales.js';

  export let track = null;
  export let trackIndex = 0;

  const dispatch = createEventDispatcher();

  const waveformOptions = ['sine', 'square', 'triangle', 'sawtooth', 'noise', 'custom'];
  const scaleOptions = Object.keys(scales);
  const filterOptions = ['none', 'lowpass', 'highpass', 'bandpass'];
  
  // Root notes in chromatic order starting from C
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

  let showEffects = false;

  const handleChange = (key, value) => {
    dispatch('update', { index: trackIndex, key, value });
  };

  const toggleBoolean = (key, current) => {
    dispatch('update', { index: trackIndex, key, value: !current });
  };

  const handleEffectsChange = (updates) => {
    const currentEffects = track?.effects ?? {};
    dispatch('update', {
      index: trackIndex,
      key: 'effects',
      value: { ...currentEffects, ...updates }
    });
  };

  const toggleEffects = () => {
    showEffects = !showEffects;
  };

  $: currentEffects = track?.effects ?? {};
</script>

{#if track}
  <div class="track-controls">
    <div class="control">
      <label for="track-name">Track name</label>
      <div class="name-color-group">
        <input
          id="track-color"
          type="color"
          value={track.color}
          on:input={(event) => handleChange('color', event.target.value)}
          title="Track color"
          aria-label="Track color"
        />
        <input
          id="track-name"
          type="text"
          value={track.name}
          on:change={(event) => handleChange('name', event.target.value)}
        />
      </div>
    </div>

    <div class="control">
      <label for="waveform">Waveform</label>
      <select
        id="waveform"
        on:change={(event) => handleChange('waveform', event.target.value)}
        value={track.waveform}
      >
        {#each waveformOptions as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
    </div>

    {#if track.waveform === 'custom'}
      <div class="control">
        <label for="custom-shape">Custom shape</label>
        <div class="slider-field">
          <input
            id="custom-shape"
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

    <div class="control">
      <label for="scale">Scale</label>
      <select
        id="scale"
        on:change={(event) => handleChange('scale', event.target.value)}
        value={track.scale}
      >
        {#each scaleOptions as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
    </div>

    <div class="control">
      <label for="root-note">Root note</label>
      <select
        id="root-note"
        on:change={(event) => handleChange('rootNote', Number(event.target.value))}
        value={track.rootNote ?? 0}
      >
        {#each rootNoteOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>

    <div class="control">
      <label for="octave">Octave</label>
      <div class="number-field">
        <input
          id="octave"
          type="number"
          min="1"
          max="7"
          value={track.octave}
          on:change={(event) => handleChange('octave', Number(event.target.value))}
        />
      </div>
    </div>

    <div class="control volume">
      <label for="volume">Volume</label>
      <div class="volume-field">
        <input
          id="volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={track.volume}
          on:input={(event) => handleChange('volume', Number(event.target.value))}
        />
        <span class="volume-box">{Math.round(track.volume * 100)}%</span>
      </div>
    </div>

    <div class="control effect-card">
      <button
        type="button"
        class="effect-toggle"
        on:click={toggleEffects}
        aria-expanded={showEffects}
      >
        <span>Effects {showEffects ? '▼' : '▶'}</span>
      </button>
      
      {#if showEffects}
        <div class="effect-header">
          <span>Filter</span>
          <select
            id="filter-type"
            on:change={(event) => handleEffectsChange({ filterType: event.target.value })}
            value={currentEffects.filterType ?? 'none'}
          >
            {#each filterOptions as option}
              <option value={option}>{option}</option>
            {/each}
          </select>
        </div>
        <div class="effect-row">
          <label for="filter-cutoff">Cutoff</label>
          <div class="slider-field">
            <input
              id="filter-cutoff"
              type="range"
              min="80"
              max="8000"
              step="10"
              value={currentEffects.filterCutoff ?? 1800}
              on:input={(event) => handleEffectsChange({ filterCutoff: Number(event.target.value) })}
            />
            <span>{Math.round(currentEffects.filterCutoff ?? 1800)} Hz</span>
          </div>
        </div>
        <div class="effect-row">
          <label for="filter-q">Resonance</label>
          <div class="slider-field">
            <input
              id="filter-q"
              type="range"
              min="0.1"
              max="20"
              step="0.1"
              value={currentEffects.filterQ ?? 0.7}
              on:input={(event) => handleEffectsChange({ filterQ: Number(event.target.value) })}
            />
            <span>{(currentEffects.filterQ ?? 0.7).toFixed(1)}</span>
          </div>
        </div>
        <div class="effect-row">
          <label for="delay-mix">Delay mix</label>
          <div class="slider-field">
            <input
              id="delay-mix"
              type="range"
              min="0"
              max="0.9"
              step="0.01"
              value={currentEffects.delayMix ?? 0}
              on:input={(event) => handleEffectsChange({ delayMix: Number(event.target.value) })}
            />
            <span>{Math.round((currentEffects.delayMix ?? 0) * 100)}%</span>
          </div>
        </div>
        <div class="effect-row compact">
          <label for="delay-time">Delay time</label>
          <div class="slider-field">
            <input
              id="delay-time"
              type="range"
              min="0.05"
              max="0.8"
              step="0.01"
              value={currentEffects.delayTime ?? 0.28}
              on:input={(event) => handleEffectsChange({ delayTime: Number(event.target.value) })}
            />
            <span>{Math.round((currentEffects.delayTime ?? 0.28) * 1000)} ms</span>
          </div>
        </div>
        <div class="effect-row compact">
          <label for="delay-feedback">Feedback</label>
          <div class="slider-field">
            <input
              id="delay-feedback"
              type="range"
              min="0"
              max="0.9"
              step="0.01"
              value={currentEffects.delayFeedback ?? 0.35}
              on:input={(event) => handleEffectsChange({ delayFeedback: Number(event.target.value) })}
            />
            <span>{Math.round((currentEffects.delayFeedback ?? 0.35) * 100)}%</span>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .track-controls {
    display: grid;
    /* explicit columns: name/color | waveform | scale | root | octave | volume | effects */
    grid-template-columns: 260px 140px 120px 90px 80px 180px 120px;
    grid-template-rows: auto auto;
    gap: 6px 12px; /* row-gap, column-gap */
    padding: 14px;
    border-radius: 20px;
    background: linear-gradient(130deg, rgba(20, 24, 32, 0.95), rgba(14, 16, 22, 0.92));
    border: 1px solid rgba(255, 255, 255, 0.04);
  }

  .control {
    /* collapse wrapper so its children are placed directly into the parent grid
       (label, then control field) — this allows labels to align in the top row */
    display: contents;
  }

  .control > label {
    display: block;
    color: rgba(255, 255, 255, 0.75);
    text-transform: uppercase;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .control-field {
    display: block;
    color: #fff;
    font-size: 0.9rem;
  }

  .control label {
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
  }

  .name-color-group {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .name-color-group input[type='text'] {
    flex: 1;
    min-width: 0;
    box-sizing: border-box;
    width: 100%;
  }

  /* Make selects and text inputs take full width in single-column layout */
  select,
  input[type='number'],
  input[type='text'] {
    width: 100%;
    box-sizing: border-box;
  }

  .name-color-group input[type='color'] {
    width: 48px;
    height: 36px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
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
  input[type='text'],
  select,
  input[type='number'],
  input[type='range'] {
    background: rgba(0, 0, 0, 0.35);
    color: #fff;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 6px 10px;
    font-size: 0.9rem;
    width: 100%;
    box-sizing: border-box;
  }

  select:focus,
  input[type='number']:focus,
  input[type='range']:focus,
  input[type='text']:focus {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.5);
    outline-offset: 2px;
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

  .volume {
    position: relative;
  }

  .volume-field {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .volume-field input[type='range'] {
    flex: 1;
  }

  .volume-box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 56px;
    padding: 6px 10px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(var(--color-accent-rgb), 0.3);
    border-radius: 8px;
    letter-spacing: 0.04em;
  }

  /* Volume slider custom styling */
  .volume-field input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }

  .volume-field input[type='range']::-webkit-slider-track {
    background: rgba(0, 0, 0, 0.35);
    height: 8px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  .volume-field input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--color-accent);
    border: 2px solid rgba(0, 0, 0, 0.3);
    box-shadow: 0 2px 8px rgba(var(--color-accent-rgb), 0.4);
    margin-top: -5px;
  }

  .volume-field input[type='range']::-webkit-slider-thumb:hover {
    background: rgba(var(--color-accent-rgb), 1.2);
    box-shadow: 0 2px 12px rgba(var(--color-accent-rgb), 0.6);
  }

  .volume-field input[type='range']::-moz-range-track {
    background: rgba(0, 0, 0, 0.35);
    height: 8px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  .volume-field input[type='range']::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--color-accent);
    border: 2px solid rgba(0, 0, 0, 0.3);
    box-shadow: 0 2px 8px rgba(var(--color-accent-rgb), 0.4);
  }

  .volume-field input[type='range']::-moz-range-thumb:hover {
    background: rgba(var(--color-accent-rgb), 1.2);
    box-shadow: 0 2px 12px rgba(var(--color-accent-rgb), 0.6);
  }

  .slider-field {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .slider-field input[type='range'] {
    flex: 1;
  }

  .slider-field span {
    font-size: 0.75rem;
    letter-spacing: 0.06em;
    color: rgba(255, 255, 255, 0.65);
    white-space: nowrap;
  }

  .effect-card {
    /* keep effect card as a block so it can span the entire grid */
    display: block;
    grid-column: 1 / -1;
    margin-top: 6px;
    padding: 18px;
    border-radius: 18px;
    background: rgba(9, 11, 16, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  /* Responsive: stack columns on narrower viewports */
  @media (max-width: 980px) {
    .track-controls {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 640px) {
    .track-controls {
      grid-template-columns: 1fr;
    }
  }

  .effect-toggle {
    width: 100%;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.75);
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .effect-toggle:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .effect-toggle span {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .effect-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 0.72rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .effect-header select {
    min-width: 120px;
    padding: 6px 10px;
    font-size: 0.85rem;
  }

  .effect-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .effect-row label {
    font-size: 0.68rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.55);
  }

  .effect-row.compact label {
    font-size: 0.65rem;
  }
</style>
