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

  $: currentEffects = track?.effects ?? {};
</script>

{#if track}
  <div class="track-controls">
    <div class="control">
      <label for="track-name">Track name</label>
      <input
        id="track-name"
        type="text"
        value={track.name}
        on:change={(event) => handleChange('name', event.target.value)}
      />
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

    <div class="control">
      <label for="track-color">Track color</label>
      <input
        id="track-color"
        type="color"
        value={track.color}
        on:input={(event) => handleChange('color', event.target.value)}
      />
    </div>

    <div class="control volume">
      <label for="volume">Volume</label>
      <input
        id="volume"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={track.volume}
        on:input={(event) => handleChange('volume', Number(event.target.value))}
      />
      <span class="volume-value">{Math.round(track.volume * 100)}%</span>
    </div>

    <div class="control effect-card">
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
    </div>

    <div class="control toggles">
      <button
        type="button"
        class="toggle-btn mute {track.mute ? 'active' : ''}"
        on:click={() => toggleBoolean('mute', track.mute)}
        title={track.mute ? 'Unmute track' : 'Mute track'}
      >
        M
      </button>
      <button
        type="button"
        class="toggle-btn solo {track.solo ? 'active' : ''}"
        on:click={() => toggleBoolean('solo', track.solo)}
        title={track.solo ? 'Unsolo track' : 'Solo track'}
      >
        S
      </button>
    </div>
  </div>
{/if}

<style>
  .track-controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 20px;
    padding: 20px;
    border-radius: 20px;
    background: linear-gradient(130deg, rgba(20, 24, 32, 0.95), rgba(14, 16, 22, 0.92));
    border: 1px solid rgba(255, 255, 255, 0.04);
  }

  .control {
    display: flex;
    flex-direction: column;
    gap: 10px;
    color: #fff;
    font-size: 0.8rem;
  }

  .control label {
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
  }

  select,
  input[type='number'],
  input[type='range'],
  input[type='text'] {
    background: rgba(0, 0, 0, 0.35);
    color: #fff;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 8px 12px;
    font-size: 0.95rem;
  }

  select:focus,
  input[type='number']:focus,
  input[type='range']:focus,
  input[type='text']:focus {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.5);
    outline-offset: 2px;
  }

  input[type='color'] {
    width: 48px;
    height: 36px;
    border: none;
    border-radius: 12px;
    padding: 0;
    background: none;
    cursor: pointer;
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

  .volume input[type='range'] {
    width: 100%;
  }

  .volume-value {
    position: absolute;
    top: -20px;
    right: 0;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
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
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 18px;
    border-radius: 18px;
    background: rgba(9, 11, 16, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.06);
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

  .toggles {
    display: flex;
    gap: 10px;
  }

  .toggle-btn {
    flex: 1;
    padding: 0;
    width: 44px;
    height: 44px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.75);
    font-weight: 700;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toggle-btn:hover {
    border-color: rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.08);
  }

  .toggle-btn.active {
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: rgba(var(--color-accent-rgb), 0.2);
    color: #fff;
  }

  .toggle-btn.mute.active {
    border-color: rgba(255, 100, 100, 0.6);
    background: rgba(255, 100, 100, 0.2);
  }
</style>
