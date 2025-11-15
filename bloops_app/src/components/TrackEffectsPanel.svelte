<script>
  import { createEventDispatcher } from 'svelte';
  import KnobControl from './KnobControl.svelte';
  import ArrowSelector from './ArrowSelector.svelte';

  export let track = null;
  export let trackIndex = 0;

  const dispatch = createEventDispatcher();
  const filterOptions = ['none', 'lowpass', 'highpass', 'bandpass'];

  let activePanel = null;

  const togglePanel = (panel) => {
    activePanel = activePanel === panel ? null : panel;
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

  $: currentEffects = track?.effects ?? {};
  $: currentAdsr = track?.adsr ?? { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 };
</script>

{#if track}
  <section class="track-effects" aria-label="Track effects and envelope controls" data-component="TrackEffectsPanel">
    <header class="effects-header">
      <div>
        <h2>Sound shaping</h2>
        <p>Tune filters, ambience, and the note envelope for this track.</p>
      </div>
      <div class="panel-toggles">
        <button
          type="button"
          class={`panel-toggle ${activePanel === 'effects' ? 'active' : ''}`}
          on:click={() => togglePanel('effects')}
          aria-expanded={activePanel === 'effects'}
        >
          <span>Effects</span>
          <span class="chevron" aria-hidden="true">{activePanel === 'effects' ? 'v' : '>'}</span>
        </button>
        <button
          type="button"
          class={`panel-toggle ${activePanel === 'adsr' ? 'active' : ''}`}
          on:click={() => togglePanel('adsr')}
          aria-expanded={activePanel === 'adsr'}
        >
          <span>ADSR Envelope</span>
          <span class="chevron" aria-hidden="true">{activePanel === 'adsr' ? 'v' : '>'}</span>
        </button>
      </div>
    </header>

    {#if activePanel === 'effects'}
      <div class="effects-grid">
        <div class="effect-header">
          <ArrowSelector
            label="Filter"
            options={filterOptions}
            value={currentEffects.filterType ?? 'none'}
            fixedWidth={true}
            useThemeColor={true}
            on:change={(event) => handleEffectsChange({ filterType: event.detail.value })}
          />
        </div>
        <KnobControl
          className="effect-knob"
          id={`filter-cutoff-${trackIndex}`}
          label="Cutoff"
          min={80}
          max={8000}
          step={10}
          value={currentEffects.filterCutoff ?? 1800}
          accent={track.color}
          valueFormatter={(val) => `${Math.round(val ?? 0)} Hz`}
          on:change={(event) => handleEffectsChange({ filterCutoff: event.detail.value })}
        />
        <KnobControl
          className="effect-knob"
          id={`filter-q-${trackIndex}`}
          label="Resonance"
          min={0.1}
          max={20}
          step={0.1}
          value={currentEffects.filterQ ?? 0.7}
          accent={track.color}
          valueFormatter={(val) => `${(val ?? 0).toFixed(1)}`}
          on:change={(event) => handleEffectsChange({ filterQ: event.detail.value })}
        />
        <KnobControl
          className="effect-knob"
          id={`delay-mix-${trackIndex}`}
          label="Delay mix"
          min={0}
          max={0.9}
          step={0.01}
          value={currentEffects.delayMix ?? 0}
          accent={track.color}
          valueFormatter={(val) => `${Math.round((val ?? 0) * 100)}%`}
          on:change={(event) => handleEffectsChange({ delayMix: event.detail.value })}
        />
        <KnobControl
          className="effect-knob"
          id={`delay-time-${trackIndex}`}
          label="Delay time"
          min={0.05}
          max={0.8}
          step={0.01}
          value={currentEffects.delayTime ?? 0.28}
          accent={track.color}
          valueFormatter={(val) => `${Math.round((val ?? 0) * 1000)} ms`}
          on:change={(event) => handleEffectsChange({ delayTime: event.detail.value })}
        />
        <KnobControl
          className="effect-knob"
          id={`delay-feedback-${trackIndex}`}
          label="Feedback"
          min={0}
          max={0.9}
          step={0.01}
          value={currentEffects.delayFeedback ?? 0.35}
          accent={track.color}
          valueFormatter={(val) => `${Math.round((val ?? 0) * 100)}%`}
          on:change={(event) => handleEffectsChange({ delayFeedback: event.detail.value })}
        />
        <KnobControl
          className="effect-knob"
          id={`reverb-mix-${trackIndex}`}
          label="Reverb mix"
          min={0}
          max={1}
          step={0.01}
          value={currentEffects.reverbMix ?? 0}
          accent={track.color}
          valueFormatter={(val) => `${Math.round((val ?? 0) * 100)}%`}
          on:change={(event) => handleEffectsChange({ reverbMix: event.detail.value })}
        />
        <KnobControl
          className="effect-knob"
          id={`reverb-time-${trackIndex}`}
          label="Reverb time"
          min={0.1}
          max={5}
          step={0.1}
          value={currentEffects.reverbTime ?? 1}
          accent={track.color}
          valueFormatter={(val) => `${(val ?? 0).toFixed(1)}s`}
          on:change={(event) => handleEffectsChange({ reverbTime: event.detail.value })}
        />
        <KnobControl
          className="effect-knob"
          id={`bitcrush-bits-${trackIndex}`}
          label="Bit depth"
          min={1}
          max={16}
          step={1}
          value={currentEffects.bitcrushBits ?? 16}
          accent={track.color}
          valueFormatter={(val) => `${Math.round(val ?? 0)} bits`}
          on:change={(event) => handleEffectsChange({ bitcrushBits: event.detail.value })}
        />
        <KnobControl
          className="effect-knob"
          id={`bitcrush-rate-${trackIndex}`}
          label="Sample rate"
          min={1}
          max={50}
          step={1}
          value={currentEffects.bitcrushRate ?? 1}
          accent={track.color}
          valueFormatter={(val) => `${Math.round(val ?? 0)}x`}
          on:change={(event) => handleEffectsChange({ bitcrushRate: event.detail.value })}
        />
      </div>
    {/if}

    {#if activePanel === 'adsr'}
      <div class="adsr-grid">
        <KnobControl
          className="effect-knob"
          id={`adsr-attack-${trackIndex}`}
          label="Attack"
          min={0.001}
          max={2}
          step={0.001}
          value={currentAdsr.attack}
          accent={track.color}
          valueFormatter={(val) => `${Math.round((val ?? 0) * 1000)} ms`}
          on:change={(event) => handleAdsrChange({ attack: event.detail.value })}
        />
        <KnobControl
          className="effect-knob"
          id={`adsr-decay-${trackIndex}`}
          label="Decay"
          min={0.001}
          max={2}
          step={0.001}
          value={currentAdsr.decay}
          accent={track.color}
          valueFormatter={(val) => `${Math.round((val ?? 0) * 1000)} ms`}
          on:change={(event) => handleAdsrChange({ decay: event.detail.value })}
        />
        <KnobControl
          className="effect-knob"
          id={`adsr-sustain-${trackIndex}`}
          label="Sustain"
          min={0}
          max={1}
          step={0.01}
          value={currentAdsr.sustain}
          accent={track.color}
          valueFormatter={(val) => `${Math.round((val ?? 0) * 100)}%`}
          on:change={(event) => handleAdsrChange({ sustain: event.detail.value })}
        />
        <KnobControl
          className="effect-knob"
          id={`adsr-release-${trackIndex}`}
          label="Release"
          min={0.001}
          max={5}
          step={0.001}
          value={currentAdsr.release}
          accent={track.color}
          valueFormatter={(val) => `${Math.round((val ?? 0) * 1000)} ms`}
          on:change={(event) => handleAdsrChange({ release: event.detail.value })}
        />
      </div>
    {/if}
  </section>
{/if}

<style>
  .track-effects {
    padding: 24px;
    border-radius: 16px;
    background: linear-gradient(135deg, var(--color-grid-bg), var(--color-grid-bg-end));
    border: 1px solid rgba(var(--color-text-muted), 0.15);
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 100%;
  }

  .effects-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    flex-wrap: wrap;
  }

  .effects-header h2 {
    margin: 0;
    font-size: 1.2rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text);
  }

  .effects-header p {
    margin: 6px 0 0;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    max-width: 360px;
    letter-spacing: 0.03em;
  }

  .panel-toggles {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .panel-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    min-height: 44px;
    border-radius: 999px;
    border: 1px solid rgba(var(--color-text), 0.2);
    background: var(--color-panel);
    color: var(--color-text-muted);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .panel-toggle:hover,
  .panel-toggle:focus {
    outline: none;
    border-color: rgba(var(--color-accent-rgb), 0.4);
    background: rgba(var(--color-accent-rgb), 0.18);
    color: var(--color-text);
  }

  .panel-toggle.active {
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: rgba(var(--color-accent-rgb), 0.25);
    color: var(--color-text);
    box-shadow: 0 6px 16px rgba(var(--color-accent-rgb), 0.25);
  }

  .chevron {
    font-size: 0.9rem;
  }

  .effects-grid,
  .adsr-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(144px, 1fr));
    gap: 16px;
    max-width: 1000px;
  }

  .effect-header {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .effects-grid :global(.effect-knob),
  .adsr-grid :global(.effect-knob) {
    background: var(--color-panel);
    border: 1px solid rgba(var(--color-text), 0.12);
    border-radius: 12px;
    padding: 14px 10px 18px;
  }

  @media (max-width: 900px) {
    .track-effects {
      padding: 20px;
    }
  }

  @media (max-width: 640px) {
    .effects-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .panel-toggles {
      width: 100%;
    }

    .panel-toggle {
      flex: 1 1 auto;
      justify-content: center;
    }
  }
</style>
