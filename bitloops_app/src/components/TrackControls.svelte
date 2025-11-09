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

  const handleAdsrChange = (updates) => {
    const currentAdsr = track?.adsr ?? {};
    dispatch('update', {
      index: trackIndex,
      key: 'adsr',
      value: { ...currentAdsr, ...updates }
    });
  };

  const toggleEffects = () => {
    showEffects = !showEffects;
  };

  const toggleAdsr = () => {
    showEffects = showEffects === 'adsr' ? false : 'adsr';
  };

  $: currentEffects = track?.effects ?? {};
  $: currentAdsr = track?.adsr ?? { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 };
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
          aria-label="Volume"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={Math.round(track.volume * 100)}
          aria-valuetext="{Math.round(track.volume * 100)} percent"
        />
        <span class="volume-box">{Math.round(track.volume * 100)}%</span>
      </div>
    </div>

    <div class="control effect-card">
      <button
        type="button"
        class="effect-toggle"
        on:click={toggleEffects}
        aria-expanded={showEffects === true}
      >
        <span>Effects {showEffects === true ? '▼' : '▶'}</span>
      </button>
      
      {#if showEffects === true}
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
        <div class="effect-row">
          <label for="reverb-mix">Reverb mix</label>
          <div class="slider-field">
            <input
              id="reverb-mix"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={currentEffects.reverbMix ?? 0}
              on:input={(event) => handleEffectsChange({ reverbMix: Number(event.target.value) })}
            />
            <span>{Math.round((currentEffects.reverbMix ?? 0) * 100)}%</span>
          </div>
        </div>
        <div class="effect-row compact">
          <label for="reverb-time">Reverb time</label>
          <div class="slider-field">
            <input
              id="reverb-time"
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={currentEffects.reverbTime ?? 1}
              on:input={(event) => handleEffectsChange({ reverbTime: Number(event.target.value) })}
            />
            <span>{(currentEffects.reverbTime ?? 1).toFixed(1)}s</span>
          </div>
        </div>
        <div class="effect-row">
          <label for="bitcrush-bits">Bit depth</label>
          <div class="slider-field">
            <input
              id="bitcrush-bits"
              type="range"
              min="1"
              max="16"
              step="1"
              value={currentEffects.bitcrushBits ?? 16}
              on:input={(event) => handleEffectsChange({ bitcrushBits: Number(event.target.value) })}
            />
            <span>{Math.round(currentEffects.bitcrushBits ?? 16)} bits</span>
          </div>
        </div>
        <div class="effect-row compact">
          <label for="bitcrush-rate">Sample rate reduction</label>
          <div class="slider-field">
            <input
              id="bitcrush-rate"
              type="range"
              min="1"
              max="50"
              step="1"
              value={currentEffects.bitcrushRate ?? 1}
              on:input={(event) => handleEffectsChange({ bitcrushRate: Number(event.target.value) })}
            />
            <span>{Math.round(currentEffects.bitcrushRate ?? 1)}x</span>
          </div>
        </div>
      {/if}
    </div>

    <div class="control effect-card">
      <button
        type="button"
        class="effect-toggle"
        on:click={toggleAdsr}
        aria-expanded={showEffects === 'adsr'}
      >
        <span>ADSR Envelope {showEffects === 'adsr' ? '▼' : '▶'}</span>
      </button>
      
      {#if showEffects === 'adsr'}
        <div class="effect-row">
          <label for="adsr-attack">Attack</label>
          <div class="slider-field">
            <input
              id="adsr-attack"
              type="range"
              min="0.001"
              max="2"
              step="0.001"
              value={currentAdsr.attack}
              on:input={(event) => handleAdsrChange({ attack: Number(event.target.value) })}
            />
            <span>{(currentAdsr.attack * 1000).toFixed(0)} ms</span>
          </div>
        </div>
        <div class="effect-row">
          <label for="adsr-decay">Decay</label>
          <div class="slider-field">
            <input
              id="adsr-decay"
              type="range"
              min="0.001"
              max="2"
              step="0.001"
              value={currentAdsr.decay}
              on:input={(event) => handleAdsrChange({ decay: Number(event.target.value) })}
            />
            <span>{(currentAdsr.decay * 1000).toFixed(0)} ms</span>
          </div>
        </div>
        <div class="effect-row">
          <label for="adsr-sustain">Sustain</label>
          <div class="slider-field">
            <input
              id="adsr-sustain"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={currentAdsr.sustain}
              on:input={(event) => handleAdsrChange({ sustain: Number(event.target.value) })}
            />
            <span>{Math.round(currentAdsr.sustain * 100)}%</span>
          </div>
        </div>
        <div class="effect-row">
          <label for="adsr-release">Release</label>
          <div class="slider-field">
            <input
              id="adsr-release"
              type="range"
              min="0.001"
              max="5"
              step="0.001"
              value={currentAdsr.release}
              on:input={(event) => handleAdsrChange({ release: Number(event.target.value) })}
            />
            <span>{(currentAdsr.release * 1000).toFixed(0)} ms</span>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .track-controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 20px;
    padding: 24px;
    border-radius: 16px;
    background: linear-gradient(130deg, rgba(20, 24, 32, 0.95), rgba(14, 16, 22, 0.92));
    border: 1px solid rgba(255, 255, 255, 0.04);
    column-gap: 24px;
  }

  .control {
    display: flex;
    flex-direction: column;
    gap: 10px;
    color: #fff;
    font-size: 0.8rem;
    padding: 12px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.03);
  }

  .control.effect-card {
    padding: 18px;
    background: rgba(9, 11, 16, 0.5);
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
    min-width: 70px;
    padding: 8px 14px;
    font-size: 0.9rem;
    font-weight: 700;
    color: #fff;
    background: rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(var(--color-accent-rgb), 0.4);
    border-radius: 10px;
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
    font-size: 0.8rem;
    letter-spacing: 0.06em;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.75);
    white-space: nowrap;
    min-width: 60px;
    text-align: right;
  }

  .effect-card {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 18px;
    border-radius: 14px;
    background: rgba(9, 11, 16, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.06);
    max-width: 600px;
  }

  .effect-toggle {
    width: 100%;
    padding: 12px 14px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.85rem;
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
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.25);
    color: #fff;
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
    font-size: 0.76rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
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
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.65);
    font-weight: 600;
  }

  .effect-row.compact label {
    font-size: 0.7rem;
  }
</style>
