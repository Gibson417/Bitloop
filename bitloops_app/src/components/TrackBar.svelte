<script>
  import { createEventDispatcher } from 'svelte';
  import { scales } from '../lib/scales.js';

  export let tracks = [];
  export let selected = 0;

  const dispatch = createEventDispatcher();

  const waveformOptions = ['sine', 'square', 'triangle', 'sawtooth', 'noise'];
  const scaleOptions = Object.keys(scales);

  const handleSelect = (idx) => {
    dispatch('select', { index: idx });
  };

  const handleChange = (key, value) => {
    dispatch('update', { index: selected, key, value });
  };

  const toggleBoolean = (key, current) => {
    dispatch('update', { index: selected, key, value: !current });
  };
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
      </button>
    {/each}
  </div>

  {#if tracks && tracks[selected]}
    <div class="control-panel">
      <div class="control">
        <label for="waveform">Waveform</label>
        <select
          id="waveform"
          on:change={(event) => handleChange('waveform', event.target.value)}
          value={tracks[selected].waveform}
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
          on:change={(event) => handleChange('scale', event.target.value)}
          value={tracks[selected].scale}
        >
          {#each scaleOptions as option}
            <option value={option}>{option}</option>
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
            value={tracks[selected].octave}
            on:change={(event) => handleChange('octave', Number(event.target.value))}
          />
        </div>
      </div>

      <div class="control volume">
        <label for="volume">Volume</label>
        <input
          id="volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={tracks[selected].volume}
          on:input={(event) => handleChange('volume', Number(event.target.value))}
        />
        <span class="volume-value">{Math.round(tracks[selected].volume * 100)}%</span>
      </div>

      <div class="control toggles">
        <button
          type="button"
          class:active={tracks[selected].mute}
          on:click={() => toggleBoolean('mute', tracks[selected].mute)}
        >
          {tracks[selected].mute ? 'Muted' : 'Mute'}
        </button>
        <button
          type="button"
          class:active={tracks[selected].solo}
          on:click={() => toggleBoolean('solo', tracks[selected].solo)}
        >
          {tracks[selected].solo ? 'Soloing' : 'Solo'}
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
    grid-auto-columns: minmax(210px, 1fr);
    gap: 16px;
    overflow-x: auto;
    padding-bottom: 6px;
    scrollbar-width: thin;
  }

  .track-list::-webkit-scrollbar {
    height: 6px;
  }

  .track-list::-webkit-scrollbar-thumb {
    background: rgba(120, 210, 185, 0.3);
    border-radius: 999px;
  }

  .track-chip {
    display: grid;
    grid-template-columns: 12px 1fr;
    align-items: center;
    padding: 12px 16px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(17, 20, 29, 0.85);
    color: #fff;
    text-align: left;
    gap: 14px;
    cursor: pointer;
    transition: transform 0.2s ease, border 0.2s ease, box-shadow 0.2s ease;
    min-width: 210px;
  }

  .track-chip:hover {
    transform: translateY(-2px);
    border-color: rgba(120, 210, 185, 0.4);
    box-shadow: 0 14px 30px rgba(15, 18, 26, 0.55);
  }

  .track-chip.selected {
    border-color: rgba(120, 210, 185, 0.6);
    box-shadow: 0 18px 40px rgba(120, 210, 185, 0.2);
  }

  .chip-strip {
    width: 12px;
    height: 100%;
    border-radius: 999px;
  }

  .chip-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
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
  input[type='range'] {
    background: rgba(0, 0, 0, 0.35);
    color: #fff;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 8px 12px;
    font-size: 0.95rem;
  }

  select:focus,
  input[type='number']:focus,
  input[type='range']:focus {
    outline: 2px solid rgba(120, 210, 185, 0.5);
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

  .toggles {
    display: flex;
    gap: 10px;
  }

  .toggles button {
    flex: 1;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.75);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.75rem;
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease;
  }

  .toggles button.active {
    border-color: rgba(120, 210, 185, 0.6);
    background: rgba(120, 210, 185, 0.2);
    color: #fff;
  }

  </style>
