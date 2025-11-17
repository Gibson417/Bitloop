<script>
  import { onDestroy } from 'svelte';
  import ArrangerTransport from './ArrangerTransport.svelte';
  import {
    BEAT_SNAP,
    addPatternToLane,
    blocksWithPattern,
    moveBlock,
    patterns,
    playback
  } from '../store/arrangerStore.js';

  const LANE_COUNT = 2;
  const PIXELS_PER_BEAT = 32;

  const beatsToPixels = (beats) => beats * PIXELS_PER_BEAT;

  $: totalBeats = $playback.loopLengthBeats ?? 64;
  $: laneWidth = beatsToPixels(totalBeats);
  $: beatsPerBar = $playback.beatsPerBar ?? 4;
  $: totalBars = Math.ceil(totalBeats / beatsPerBar);
  $: laneBlockMap = Array.from({ length: LANE_COUNT }, (_, laneIndex) =>
    $blocksWithPattern
      .filter((block) => block.lane === laneIndex)
      .sort((a, b) => a.startBeat - b.startBeat)
  );

  const handlePaletteAdd = (patternId, lane = 0) => {
    addPatternToLane(patternId, lane);
  };

  let dragContext = null;

  const snapBeat = (beat) => Math.round(beat / BEAT_SNAP) * BEAT_SNAP;

  const handleBlockPointerDown = (event, block) => {
    event.preventDefault();
    const laneElement = event.currentTarget.closest('.arranger__lane');
    if (!laneElement) return;
    const rect = laneElement.getBoundingClientRect();
    const pointerBeat = (event.clientX - rect.left) / PIXELS_PER_BEAT;
    dragContext = {
      id: block.id,
      lane: block.lane,
      rect,
      offset: pointerBeat - block.startBeat
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (event) => {
    if (!dragContext) return;
    const beat = (event.clientX - dragContext.rect.left) / PIXELS_PER_BEAT - dragContext.offset;
    const snapped = snapBeat(beat);
    moveBlock(dragContext.id, { startBeat: snapped });
  };

  const handlePointerUp = () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    dragContext = null;
  };

  onDestroy(() => {
    if (dragContext) {
      handlePointerUp();
    }
  });

  const isBlockActive = (block) => {
    if (!$playback.isPlaying || !block.pattern) return false;
    const blockStart = block.startBeat;
    const blockEnd = block.startBeat + block.pattern.lengthInBeats;
    return $playback.playheadBeat >= blockStart && $playback.playheadBeat < blockEnd;
  };
</script>

<section class="arranger">
  <header class="arranger__header">
    <div>
      <h2>Pattern Arranger</h2>
      <p>Create a linear structure with drag-and-drop blocks.</p>
    </div>
    <ArrangerTransport />
  </header>

  <div class="arranger__content">
    <aside class="arranger__palette">
      <h3>Pattern palette</h3>
      <p class="arranger__palette-hint">Click a pattern to append it to the lane.</p>
      <div class="arranger__palette-list">
        {#each $patterns as pattern}
          <button
            type="button"
            class="palette-item"
            style={`--pattern-color: ${pattern.color}`}
            on:click={() => handlePaletteAdd(pattern.id)}
            aria-label={`Add ${pattern.name} pattern (${pattern.lengthInBeats} beats) to lane`}
          >
            <span class="palette-item__name">{pattern.name}</span>
            <span class="palette-item__meta">{pattern.lengthInBeats} beats</span>
          </button>
        {/each}
      </div>
    </aside>

    <div class="arranger__timeline">
      <div class="arranger__ruler" style={`width: ${laneWidth}px`}>
        {#each Array.from({ length: totalBars }) as _, index}
          <div class="ruler__segment" style={`width: ${beatsToPixels(beatsPerBar)}px`}>
            <span>Bar {index + 1}</span>
          </div>
        {/each}
      </div>

      <div class="arranger__lanes-wrapper">
        <div class="arranger__lanes" style={`width: ${laneWidth}px`}>
          {#each Array.from({ length: LANE_COUNT }) as _, laneIndex}
            <div class="arranger__lane" data-lane={laneIndex}>
              {#each laneBlockMap[laneIndex] as block (block.id)}
                <div
                  class={`arranger__block ${isBlockActive(block) ? 'arranger__block--active' : ''}`}
                  style={`width: ${beatsToPixels(block.pattern?.lengthInBeats ?? 0)}px; transform: translateX(${beatsToPixels(block.startBeat)}px); background: ${block.pattern?.color ?? '#78D2B9'};`}
                  on:pointerdown={(event) => handleBlockPointerDown(event, block)}
                  role="button"
                  tabindex="0"
                  aria-label={`${block.pattern?.name ?? 'Pattern'} block in lane ${block.lane + 1}, starting at beat ${block.startBeat}. Click and drag to reposition.`}
                >
                  <span>{block.pattern?.name ?? 'Pattern'}</span>
                </div>
              {/each}
            </div>
          {/each}

          <div class="arranger__playhead" style={`left: ${beatsToPixels($playback.playheadBeat)}px`}></div>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .arranger {
    display: flex;
    flex-direction: column;
    gap: 24px;
    background: rgba(34, 38, 50, 0.9);
    padding: 24px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: white;
  }

  .arranger__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
  }

  .arranger__header h2 {
    margin: 0;
    font-size: 1.2rem;
  }

  .arranger__header p {
    margin: 0;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.75rem;
  }

  .arranger__content {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 24px;
  }

  .arranger__palette {
    background: rgba(0, 0, 0, 0.25);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .arranger__palette h3 {
    margin: 0;
    font-size: 0.95rem;
  }

  .arranger__palette-hint {
    margin: 0;
    color: rgba(255, 255, 255, 0.65);
    font-size: 0.7rem;
  }

  .arranger__palette-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .palette-item {
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    padding: 10px 12px;
    min-height: 44px;
    background: rgba(0, 0, 0, 0.2);
    color: white;
    text-align: left;
    cursor: pointer;
    transition: background 150ms ease, transform 150ms ease, border-color 150ms ease;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .palette-item::before {
    content: '';
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: var(--pattern-color, var(--color-accent));
    margin-right: 8px;
  }

  .palette-item:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateX(2px);
  }

  .palette-item:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
    border-color: rgba(var(--color-accent-rgb), 0.4);
  }

  .palette-item:active {
    transform: translateX(1px) scale(0.98);
  }

  .palette-item__name {
    font-weight: 600;
  }

  .palette-item__meta {
    display: block;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.65);
    margin-top: 2px;
  }

  .arranger__timeline {
    overflow-x: auto;
    padding-bottom: 12px;
  }

  .arranger__ruler {
    display: flex;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 12px;
    position: relative;
  }

  .ruler__segment {
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    padding-left: 8px;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .arranger__lanes-wrapper {
    position: relative;
    overflow: hidden;
  }

  .arranger__lanes {
    position: relative;
  }

  .arranger__lane {
    position: relative;
    height: 70px;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
  }

  .arranger__lane:last-child {
    border-bottom: none;
  }

  .arranger__block {
    position: absolute;
    top: 12px;
    height: 46px;
    border-radius: 8px;
    color: var(--color-background);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    cursor: grab;
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);
    transition: filter 150ms ease, box-shadow 150ms ease;
    user-select: none;
  }

  .arranger__block:hover {
    filter: brightness(1.08);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.4);
  }

  .arranger__block:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .arranger__block:active {
    cursor: grabbing;
    filter: brightness(1.05);
  }

  .arranger__block--active {
    outline: 3px solid var(--color-accent-bright);
    outline-offset: -1px;
    color: var(--color-background);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45), 0 0 16px rgba(var(--color-accent-bright-rgb), 0.4);
  }

  .arranger__playhead {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--color-accent-bright);
    box-shadow: 0 0 10px var(--color-accent-bright);
    pointer-events: none;
  }

  @media (max-width: 900px) {
    .arranger__content {
      grid-template-columns: 1fr;
    }

    .arranger__palette {
      order: 2;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .palette-item,
    .arranger__block {
      transition: none;
    }

    .palette-item:hover,
    .palette-item:active {
      transform: none;
    }

    .arranger__block:hover,
    .arranger__block:active {
      transform: none;
    }
  }
</style>
