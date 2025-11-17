<script>
  import { createEventDispatcher } from 'svelte';
  import { scales, parseCustomScale } from '../lib/scales.js';

  export let tracks = [];
  export let selected = 0;
  export let maxTracks = 10;

  const canAddMore = () => tracks.length < maxTracks;
  const canRemoveTrack = (index) => tracks.length > 1 && index >= 0 && index < tracks.length;

  const dispatch = createEventDispatcher();

  const waveformOptions = ['sine', 'square', 'triangle', 'sawtooth', 'noise'];
  const scaleOptions = [...Object.keys(scales), 'custom'];
  const filterOptions = ['none', 'lowpass', 'highpass', 'bandpass'];

  let customScaleInput = '';
  let customScaleError = '';

  const handleSelect = (idx) => {
    dispatch('select', { index: idx });
  };

  const handleAddTrack = () => {
    if (!canAddMore()) return;
    dispatch('add');
  };

  const handleRemoveTrack = (event, idx) => {
    event.stopPropagation();
    if (!canRemoveTrack(idx)) return;
    dispatch('remove', { index: idx });
  };

  const handleChange = (key, value) => {
    dispatch('update', { index: selected, key, value });
  };

  const toggleBoolean = (key, current) => {
    dispatch('update', { index: selected, key, value: !current });
  };

  const handleEffectsChange = (updates) => {
    const current = tracks[selected] ?? {};
    dispatch('update', {
      index: selected,
      key: 'effects',
      value: { ...(current.effects ?? {}), ...updates }
    });
  };

  const handleScaleChange = (newScale) => {
    if (newScale === 'custom') {
      // Initialize with chromatic scale as default
      const defaultCustomScale = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      customScaleInput = defaultCustomScale.join(', ');
      dispatch('update', { index: selected, key: 'scale', value: 'custom' });
      dispatch('update', { index: selected, key: 'customScale', value: defaultCustomScale });
    } else {
      dispatch('update', { index: selected, key: 'scale', value: newScale });
      dispatch('update', { index: selected, key: 'customScale', value: null });
    }
  };

  const handleCustomScaleInput = (event) => {
    const input = event.target.value;
    customScaleInput = input;
    const parsed = parseCustomScale(input);
    
    if (parsed) {
      customScaleError = '';
      dispatch('update', { index: selected, key: 'customScale', value: parsed });
    } else {
      customScaleError = 'Invalid scale. Use 0-11 separated by commas or spaces, must include 0.';
    }
  };

  $: currentTrack = tracks?.[selected] ?? null;
  $: currentEffects = currentTrack?.effects ?? {};
  $: {
    if (currentTrack?.scale === 'custom' && currentTrack?.customScale) {
      customScaleInput = currentTrack.customScale.join(', ');
      customScaleError = '';
    }
  }
</script>

<div class="trackbar">
  <div class="track-list" role="tablist" aria-label="Tracks">
    {#each tracks as track, idx}
      <button
        class="track-chip {idx === selected ? 'selected' : ''}"
        on:click={() => handleSelect(idx)}
        type="button"
        role="tab"
        aria-selected={idx === selected}
      >
        <span class="chip-strip" style={`background:${track.color}`}></span>
        <span class="chip-content">
          <span class="chip-name">{track.name}</span>
          <span class="chip-meta">{track.waveform} • {track.scale}</span>
        </span>
        {#if canRemoveTrack(idx)}
          <span class="chip-actions">
            <button
              type="button"
              class="chip-remove"
              aria-label={`Remove ${track.name}`}
              on:click={(event) => handleRemoveTrack(event, idx)}
            >
              ×
            </button>
          </span>
        {/if}
      </button>
    {/each}
    <button
      class="track-chip add"
      type="button"
      on:click={handleAddTrack}
      disabled={!canAddMore()}
      aria-label="Add track"
    >
      <span class="chip-strip" aria-hidden="true">+</span>
      <span class="chip-content">
        <span class="chip-name">Add track</span>
        <span class="chip-meta">{tracks.length}/{maxTracks}</span>
      </span>
    </button>
  </div>

  {#if currentTrack}
    <div class="control-panel">
      <div class="control">
        <label for="track-name">Track name</label>
        <input
          id="track-name"
          type="text"
          value={currentTrack.name}
          on:change={(event) => handleChange('name', event.target.value)}
        />
      </div>

      <div class="control">
        <label for="waveform">Waveform</label>
        <select
          id="waveform"
          on:change={(event) => handleChange('waveform', event.target.value)}
          value={currentTrack.waveform}
        >
          {#each waveformOptions as option}
            <option value={option}>{option}</option>
          {/each}
        </select>
      </div>

      <div class="control">
        <label for="scale">Scale</label>
        <select
          id="scale"
          on:change={(event) => handleScaleChange(event.target.value)}
          value={currentTrack.scale}
        >
          {#each scaleOptions as option}
            <option value={option}>{option}</option>
          {/each}
        </select>
      </div>

      {#if currentTrack.scale === 'custom'}
        <div class="control">
          <label for="custom-scale">Custom scale (0-11)</label>
          <input
            id="custom-scale"
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

      <div class="control">
        <label for="octave">Octave</label>
        <div class="number-field">
          <input
            id="octave"
            type="number"
            min="1"
            max="7"
            value={currentTrack.octave}
            on:change={(event) => handleChange('octave', Number(event.target.value))}
          />
        </div>
      </div>

      <div class="control">
        <label for="track-color">Track color</label>
        <input
          id="track-color"
          type="color"
          value={currentTrack.color}
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
          value={currentTrack.volume}
          on:input={(event) => handleChange('volume', Number(event.target.value))}
        />
        <span class="volume-value">{Math.round(currentTrack.volume * 100)}%</span>
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
          class:active={currentTrack.mute}
          on:click={() => toggleBoolean('mute', currentTrack.mute)}
        >
          {currentTrack.mute ? 'Muted' : 'Mute'}
        </button>
        <button
          type="button"
          class:active={currentTrack.solo}
          on:click={() => toggleBoolean('solo', currentTrack.solo)}
        >
          {currentTrack.solo ? 'Soloing' : 'Solo'}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .trackbar {
    display: flex;
    flex-direction: column;
    padding: 24px 32px 16px;
    gap: 18px;
  }

  .track-list {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(110px, 1fr);
    gap: 16px;
    overflow-x: auto;
    padding-bottom: 6px;
    scrollbar-width: thin;
  }

  .track-list::-webkit-scrollbar {
    height: 6px;
  }

  .track-list::-webkit-scrollbar-thumb {
    background: rgba(var(--color-accent-rgb), 0.3);
    border-radius: 999px;
  }

  .track-chip {
    display: grid;
    grid-template-columns: 12px 1fr auto;
    align-items: center;
    padding: 12px 16px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(17, 20, 29, 0.85);
    color: var(--color-text);
    text-align: left;
    gap: 14px;
    cursor: pointer;
    transition: transform 0.2s ease, border 0.2s ease, box-shadow 0.2s ease;
    min-width: 110px;
  }

  .track-chip:hover {
    transform: translateY(-2px);
    border-color: rgba(var(--color-accent-rgb), 0.4);
    box-shadow: 0 14px 30px rgba(15, 18, 26, 0.55);
  }

  .track-chip.selected {
    border-color: rgba(var(--color-accent-rgb), 0.6);
    box-shadow: 0 18px 40px rgba(var(--color-accent-rgb), 0.2);
  }

  .chip-strip {
    width: 12px;
    height: 100%;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  .chip-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .chip-actions {
    display: flex;
    align-items: center;
  }

  .chip-remove {
    background: rgba(255, 255, 255, 0.08);
    border: none;
    color: var(--color-text-muted);
    border-radius: 50%;
    width: 28px;
    height: 28px;
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease, color 0.2s ease;
  }

  .chip-remove:hover,
  .chip-remove:focus {
    background: rgba(255, 80, 80, 0.25);
    color: var(--color-text);
    outline: none;
  }

  .track-chip.add {
    border-style: dashed;
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(17, 20, 29, 0.6);
    min-width: 120px;
  }

  .track-chip.add:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .chip-name {
    font-weight: 600;
    font-size: 1rem;
    letter-spacing: 0.04em;
  }

  .chip-meta {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(255, 255, 255, 0.5);
  }

  .control-panel {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 20px;
    padding: 24px;
    border-radius: 16px;
    background: linear-gradient(130deg, rgba(20, 24, 32, 0.95), rgba(14, 16, 22, 0.92));
    border: 1px solid rgba(255, 255, 255, 0.04);
  }

  .control {
    display: flex;
    flex-direction: column;
    gap: 10px;
    color: var(--color-text);
    font-size: 0.8rem;
  }

  .control label {
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
    color: var(--color-text-muted);
  }

  select,
  input[type='number'],
  input[type='range'],
  input[type='text'] {
    background: rgba(0, 0, 0, 0.35);
    color: var(--color-text);
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

  input[type='color'] {
    width: 48px;
    height: 36px;
    border: none;
    border-radius: 10px;
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
    color: var(--color-text-muted);
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
    color: var(--color-text-muted);
    white-space: nowrap;
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
  }

  .effect-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 0.72rem;
    color: var(--color-text-muted);
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
    color: var(--color-text-muted);
  }

  .effect-row.compact label {
    font-size: 0.65rem;
  }

  .toggles {
    display: flex;
    gap: 10px;
  }

  .toggles button {
    flex: 1;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.75rem;
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease;
  }

  .toggles button.active {
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: rgba(var(--color-accent-rgb), 0.2);
    color: var(--color-text);
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
    color: var(--color-text-muted);
    margin-top: 4px;
    line-height: 1.3;
  }

  </style>
