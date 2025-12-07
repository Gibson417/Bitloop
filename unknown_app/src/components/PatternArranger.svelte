<script>
  import { onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import ArrangerTransport from './ArrangerTransport.svelte';
  import {
    BEAT_SNAP,
    addPatternToLane,
    blocks,
    blocksWithPattern,
    moveBlock,
    removeBlock,
    swapBlocks,
    patterns as arrangerPatterns,
    playback
  } from '../store/arrangerStore.js';

  // Props for pattern management from projectStore
  export let patterns = [];
  export let selectedPattern = 0;

  const dispatch = createEventDispatcher();

  const LANE_COUNT = 1;
  const PIXELS_PER_BEAT = 16;

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

  // Sync arrangerStore patterns with projectStore patterns
  // Also filter out blocks that reference invalid pattern IDs
  $: if (patterns.length > 0) {
    const newPatterns = patterns.map((p, idx) => ({
      id: p.id,
      name: p.name,
      color: getPatternColor(idx),
      lengthInBeats: Math.round((p.bars || 2) * (beatsPerBar || 4))
    }));
    arrangerPatterns.set(newPatterns);
    
    // Remove blocks with invalid pattern IDs
    const validPatternIds = new Set(newPatterns.map(p => p.id));
    blocks.update(current => 
      current.filter(block => validPatternIds.has(block.patternId))
    );
  }

  const handlePaletteAdd = (patternId, lane = 0) => {
    addPatternToLane(patternId, lane);
  };

  // Pattern management handlers
  const handlePatternSelect = (index) => {
    dispatch('patternselect', { index });
  };

  const handlePatternAdd = () => {
    dispatch('patternadd');
  };

  const handlePatternDuplicate = (index) => {
    dispatch('patternduplicate', { index });
  };

  const handlePatternRemove = (index) => {
    dispatch('patternremove', { index });
  };

  const handlePatternRename = (index, event) => {
    const newName = event.target.value;
    if (newName && newName.trim()) {
      dispatch('patternrename', { index, name: newName });
    }
  };

  // Generate a color for each pattern based on index
  const getPatternColor = (index) => {
    const colors = [
      '#78d2b9', // accent (default)
      '#ff6b9d', // pink
      '#ffd93d', // yellow
      '#6bcf7f', // green
      '#a78bfa', // purple
      '#60a5fa', // blue
      '#fb923c', // orange
      '#ec4899', // magenta
    ];
    return colors[index % colors.length];
  };

  const handleKeyNavigation = (event, index) => {
    // Handle Enter key for selection
    if (event.key === 'Enter') {
      handlePatternSelect(index);
      return;
    }

    // Handle arrow key navigation
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      const nextIndex = Math.min(index + 1, patterns.length - 1);
      if (nextIndex !== index) {
        handlePatternSelect(nextIndex);
        // Focus the next pattern item
        setTimeout(() => {
          const items = document.querySelectorAll('.pattern-item');
          items[nextIndex]?.focus();
        }, 0);
      }
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const prevIndex = Math.max(index - 1, 0);
      if (prevIndex !== index) {
        handlePatternSelect(prevIndex);
        // Focus the previous pattern item
        setTimeout(() => {
          const items = document.querySelectorAll('.pattern-item');
          items[prevIndex]?.focus();
        }, 0);
      }
    } else if (event.key === 'Home') {
      event.preventDefault();
      handlePatternSelect(0);
      // Focus the first pattern item
      setTimeout(() => {
        const items = document.querySelectorAll('.pattern-item');
        items[0]?.focus();
      }, 0);
    } else if (event.key === 'End') {
      event.preventDefault();
      const lastIndex = patterns.length - 1;
      handlePatternSelect(lastIndex);
      // Focus the last pattern item
      setTimeout(() => {
        const items = document.querySelectorAll('.pattern-item');
        items[lastIndex]?.focus();
      }, 0);
    }
  };

  $: canRemovePattern = patterns.length > 0;

  let dragContext = null;
  let draggedPatternId = null;
  let draggedPatternIndex = null;
  let laneDragOver = false;
  let dropTargetIndex = null;

  const snapBeat = (beat) => Math.round(beat / BEAT_SNAP) * BEAT_SNAP;

  const handlePatternDragStart = (event, patternId, index) => {
    draggedPatternId = patternId;
    draggedPatternIndex = index;
    laneDragOver = false;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', patternId);
      event.dataTransfer.effectAllowed = 'copyMove';
    }
  };

  const handlePatternDragEnd = () => {
    draggedPatternId = null;
    draggedPatternIndex = null;
    laneDragOver = false;
    dropTargetIndex = null;
  };

  const handlePatternDragOver = (event, index) => {
    if (draggedPatternIndex === null) return;
    event.preventDefault();
    dropTargetIndex = index;
  };

  const handlePatternDragLeave = () => {
    if (draggedPatternIndex !== null) {
      dropTargetIndex = null;
    }
  };

  const handlePatternDrop = (event, index) => {
    event.preventDefault();
    if (draggedPatternIndex !== null && draggedPatternIndex !== index) {
      dispatch('patternreorder', { fromIndex: draggedPatternIndex, toIndex: index });
    }
    dropTargetIndex = null;
  };

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
      offset: pointerBeat - block.startBeat,
      initialStartBeat: block.startBeat
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  let swapTargetBlockId = null;

  const handlePointerMove = (event) => {
    if (!dragContext) return;
    const beat = (event.clientX - dragContext.rect.left) / PIXELS_PER_BEAT - dragContext.offset;
    const snapped = snapBeat(beat);
    
    // Find if we're hovering over another block to swap with
    const draggedBlock = $blocksWithPattern.find(b => b.id === dragContext.id);
    const draggedPattern = draggedBlock?.pattern;
    const draggedLength = draggedPattern?.lengthInBeats ?? 0;
    const draggedMidpoint = snapped + draggedLength / 2;
    
    // Find blocks in the same lane
    const laneBlocks = $blocksWithPattern.filter(b => 
      b.lane === dragContext.lane && b.id !== dragContext.id
    );
    
    // Check if dragged block's midpoint is over another block
    let newSwapTarget = null;
    for (const otherBlock of laneBlocks) {
      const otherLength = otherBlock.pattern?.lengthInBeats ?? 0;
      if (draggedMidpoint >= otherBlock.startBeat && 
          draggedMidpoint < otherBlock.startBeat + otherLength) {
        newSwapTarget = otherBlock.id;
        break;
      }
    }
    
    swapTargetBlockId = newSwapTarget;
    
    // Only move block if not hovering over a swap target
    if (!swapTargetBlockId) {
      moveBlock(dragContext.id, { startBeat: snapped });
    }
  };

  const handlePointerUp = () => {
    if (swapTargetBlockId && dragContext) {
      // Perform the swap
      swapBlocks(dragContext.id, swapTargetBlockId);
    }
    
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    dragContext = null;
    swapTargetBlockId = null;
  };

  const handleLaneDragOver = (event) => {
    const patternId = draggedPatternId || event.dataTransfer?.getData('text/plain');
    if (!patternId) return;
    event.preventDefault();
    laneDragOver = true;
  };

  const handleLaneDragLeave = () => {
    laneDragOver = false;
  };

  const handleLaneDrop = (event, laneIndex) => {
    const patternId = draggedPatternId || event.dataTransfer?.getData('text/plain');
    if (!patternId) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const beat = (event.clientX - rect.left) / PIXELS_PER_BEAT;
    addPatternToLane(patternId, laneIndex, beat);
    laneDragOver = false;
    draggedPatternId = null;
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

  const handleBlockRemove = (event, blockId) => {
    event.stopPropagation();
    removeBlock(blockId);
  };

  const handleBlockKeydown = (event, blockId) => {
    // Delete or Backspace to remove block
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      removeBlock(blockId);
    }
  };

  let hoveredBlockId = null;
</script>

<section class="arranger" data-component="PatternArranger">
  <header class="arranger__header">
    <div>
      <h2>Pattern Arranger</h2>
      <p>Manage patterns and create a linear arrangement with drag-and-drop blocks.</p>
    </div>
    <div class="arranger__header-controls">
      <div class="render-buttons">
        <button
          type="button"
          class="render-btn"
          on:click={() => dispatch('rendermidi')}
          title="Render arrangement to MIDI"
          aria-label="Render arrangement to MIDI"
        >
          <svg class="btn-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
          <span>MIDI</span>
        </button>
        <button
          type="button"
          class="render-btn"
          on:click={() => dispatch('render')}
          title="Render arrangement to WAV"
          aria-label="Render arrangement to WAV"
        >
          <svg class="btn-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          </svg>
          <span>WAV</span>
        </button>
      </div>
      <ArrangerTransport />
    </div>
  </header>

  <div class="arranger__content">
    <aside class="arranger__palette">
      <div class="palette-header">
        <div>
          <h3>Patterns</h3>
          <p class="arranger__palette-hint">Manage patterns and arrange them in lanes.</p>
        </div>
        <button
          type="button"
          class="add-pattern-btn"
          on:click={handlePatternAdd}
          title="Add new pattern"
          aria-label="Add new pattern"
        >
          <svg class="btn-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
      <div class="arranger__palette-list">
        {#each patterns as pattern, index (pattern.id)}
          <div 
            class="pattern-item"
            class:selected={index === selectedPattern}
            class:dragging={draggedPatternIndex === index}
            class:drop-target={dropTargetIndex === index && draggedPatternIndex !== index}
            role="button"
            tabindex="0"
            on:click={() => handlePatternSelect(index)}
            on:keydown={(e) => handleKeyNavigation(e, index)}
            draggable="true"
            on:dragstart={(event) => handlePatternDragStart(event, pattern.id, index)}
            on:dragend={handlePatternDragEnd}
            on:dragover={(event) => handlePatternDragOver(event, index)}
            on:dragleave={handlePatternDragLeave}
            on:drop={(event) => handlePatternDrop(event, index)}
            aria-label="Pattern {index + 1}: {pattern.name}"
          >
            <div class="pattern-main">
              <span class="pattern-strip" style={`background:${getPatternColor(index)}`}></span>
              <span class="pattern-id" style={`color:${getPatternColor(index)}`}>P{index + 1}</span>
              <input
                type="text"
                class="pattern-name"
                value={pattern.name}
                on:change={(e) => handlePatternRename(index, e)}
                on:click={(e) => e.stopPropagation()}
                placeholder="Pattern name"
                aria-label="Pattern name"
              />
            </div>
            <div class="pattern-actions">
              <button
                type="button"
                class="pattern-action-btn palette-action"
                on:click|stopPropagation={() => handlePaletteAdd(pattern.id)}
                title="Add to lane"
                aria-label="Add pattern to lane"
              >
                <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <button
                type="button"
                class="pattern-action-btn"
                on:click|stopPropagation={() => handlePatternDuplicate(index)}
                title="Duplicate pattern"
                aria-label="Duplicate pattern"
              >
                <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              {#if canRemovePattern}
                <button
                  type="button"
                  class="pattern-action-btn remove"
                  on:click|stopPropagation={() => handlePatternRemove(index)}
                  title="Remove pattern"
                  aria-label="Remove pattern"
                >
                  <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              {/if}
            </div>
          </div>
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
            <div
              class="arranger__lane"
              class:arranger__lane--dragging={laneDragOver}
              data-lane={laneIndex}
              role="group"
              aria-label={`Lane ${laneIndex + 1}`}
              on:dragover={handleLaneDragOver}
              on:dragleave={handleLaneDragLeave}
              on:drop={(event) => handleLaneDrop(event, laneIndex)}
            >
              {#each laneBlockMap[laneIndex] as block (block.id)}
                <div
                  class={`arranger__block ${isBlockActive(block) ? 'arranger__block--active' : ''} ${swapTargetBlockId === block.id ? 'arranger__block--swap-target' : ''} ${dragContext?.id === block.id ? 'arranger__block--dragging' : ''}`}
                  style={`width: ${beatsToPixels(block.pattern?.lengthInBeats ?? 0)}px; transform: translateX(${beatsToPixels(block.startBeat)}px); background: ${block.pattern?.color ?? '#78D2B9'};`}
                  on:pointerdown={(event) => handleBlockPointerDown(event, block)}
                  on:mouseenter={() => hoveredBlockId = block.id}
                  on:mouseleave={() => hoveredBlockId = null}
                  on:keydown={(event) => handleBlockKeydown(event, block.id)}
                  role="button"
                  tabindex="0"
                  aria-label={`${block.pattern?.name ?? 'Pattern'} block in lane ${block.lane + 1}, starting at beat ${block.startBeat}. Click and drag to reposition or swap with other blocks. Press Delete or Backspace to remove.`}
                >
                  <span class="block-label">{block.pattern?.name ?? 'Pattern'}</span>
                  {#if hoveredBlockId === block.id}
                    <button
                      class="block-remove-btn"
                      on:click={(event) => handleBlockRemove(event, block.id)}
                      on:pointerdown={(event) => event.stopPropagation()}
                      title="Remove block"
                      aria-label="Remove this block from the lane"
                    >
                      <svg class="remove-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  {/if}
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
    background: var(--color-panel);
    padding: 24px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: var(--color-text);
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
    color: var(--color-text-muted);
    font-size: 0.75rem;
  }

  .arranger__header-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .render-buttons {
    display: flex;
    gap: 8px;
  }

  .render-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid rgba(var(--color-accent-rgb), 0.3);
    background: rgba(var(--color-accent-rgb), 0.1);
    color: rgba(var(--color-accent-rgb), 0.95);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .render-btn:hover {
    border-color: rgba(var(--color-accent-rgb), 0.5);
    background: rgba(var(--color-accent-rgb), 0.2);
    transform: translateY(-1px);
  }

  .render-btn:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .render-btn .btn-icon {
    width: 16px;
    height: 16px;
  }

  .arranger__content {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 24px;
  }

  .arranger__palette {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .palette-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .arranger__palette h3 {
    margin: 0;
    font-size: 0.95rem;
  }

  .arranger__palette-hint {
    margin: 4px 0 0 0;
    color: var(--color-text-muted);
    font-size: 0.7rem;
  }

  .add-pattern-btn {
    min-width: 36px;
    min-height: 36px;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid rgba(var(--color-accent-rgb), 0.4);
    background: rgba(var(--color-accent-rgb), 0.16);
    color: rgba(var(--color-accent-rgb), 0.9);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .add-pattern-btn:hover {
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: rgba(var(--color-accent-rgb), 0.26);
    transform: scale(1.05);
  }

  .add-pattern-btn:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .add-pattern-btn .btn-icon {
    width: 18px;
    height: 18px;
  }

  .arranger__palette-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pattern-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.08);
    cursor: pointer;
    transition: all 0.2s ease;
    flex-wrap: nowrap;
  }

  .pattern-item:hover {
    background: rgba(0, 0, 0, 0.3);
    border-color: rgba(var(--color-accent-rgb), 0.3);
  }

  .pattern-item.selected {
    background: rgba(var(--color-accent-rgb), 0.18);
    border-color: rgba(var(--color-accent-rgb), 0.5);
  }

  .pattern-item:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .pattern-item.dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  .pattern-item.drop-target {
    border-color: rgba(var(--color-accent-rgb), 0.8);
    background: rgba(var(--color-accent-rgb), 0.25);
    box-shadow: 0 0 12px rgba(var(--color-accent-rgb), 0.4);
  }

  .pattern-main {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  .pattern-strip {
    width: 6px;
    height: 24px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .pattern-id {
    font-weight: 700;
    font-size: 0.85rem;
    letter-spacing: 0.05em;
    opacity: 0.9;
    flex-shrink: 0;
    min-width: 24px;
  }

  .pattern-name {
    flex: 1;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    padding: 4px 8px;
    color: var(--color-text);
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.2s ease;
    min-width: 0;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .pattern-name:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .pattern-name:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(var(--color-accent-rgb), 0.4);
  }

  .pattern-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
    justify-content: flex-end;
  }

  .pattern-action-btn {
    min-width: 32px;
    min-height: 32px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(0, 0, 0, 0.3);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    flex-shrink: 0;
  }

  .pattern-action-btn .action-icon {
    width: 14px;
    height: 14px;
    display: block;
  }

  .pattern-action-btn:hover {
    border-color: rgba(var(--color-accent-rgb), 0.5);
    background: rgba(var(--color-accent-rgb), 0.2);
    color: var(--color-text);
    transform: scale(1.05);
  }

  .pattern-action-btn.palette-action:hover {
    border-color: rgba(var(--color-accent-bright-rgb), 0.6);
    background: rgba(var(--color-accent-bright-rgb), 0.25);
  }

  .pattern-action-btn.remove:hover {
    border-color: rgba(255, 100, 100, 0.5);
    background: rgba(255, 100, 100, 0.2);
    color: var(--color-text);
  }

  .pattern-action-btn:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .arranger__timeline {
    overflow-x: auto;
    padding-bottom: 12px;
    scrollbar-width: thin;
    scrollbar-color: rgba(var(--color-accent-rgb), 0.4) rgba(0, 0, 0, 0.4);
    max-width: 100%;
  }

  .arranger__timeline::-webkit-scrollbar {
    height: 10px;
  }

  .arranger__timeline::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 999px;
  }

  .arranger__timeline::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.65), rgba(var(--color-note-active-rgb), 0.55));
    border-radius: 999px;
    border: 2px solid rgba(0, 0, 0, 0.4);
  }

  .arranger__timeline::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.85), rgba(var(--color-note-active-rgb), 0.75));
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
    color: var(--color-text-muted);
  }

  .arranger__lanes-wrapper {
    position: relative;
    overflow: visible;
    min-width: 100%;
  }

  .arranger__lanes {
    position: relative;
    min-width: 100%;
  }

  .arranger__lane {
    position: relative;
    height: 120px;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
  }

  .arranger__lane:last-child {
    border-bottom: none;
  }

  .arranger__lane--dragging {
    background: linear-gradient(90deg, rgba(var(--color-accent-rgb), 0.08), rgba(var(--color-note-active-rgb), 0.08));
    outline: 2px dashed rgba(var(--color-accent-rgb), 0.6);
    outline-offset: -6px;
  }

  .arranger__block {
    position: absolute;
    top: 10px;
    height: 100px;
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

  .arranger__block .block-label {
    padding: 0 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .block-label {
    pointer-events: none;
  }

  .block-remove-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: none;
    background: rgba(255, 50, 50, 0.9);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: all 0.2s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    z-index: 10;
  }

  .block-remove-btn .remove-icon {
    width: 14px;
    height: 14px;
  }

  .block-remove-btn:hover {
    background: rgba(255, 30, 30, 1);
    transform: scale(1.1);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
  }

  .block-remove-btn:active {
    transform: scale(0.95);
  }

  .block-remove-btn:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 2px;
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

  .arranger__block--dragging {
    cursor: grabbing;
    opacity: 0.7;
    z-index: 100;
  }

  .arranger__block--swap-target {
    outline: 3px dashed rgba(var(--color-accent-rgb), 0.8);
    outline-offset: -1px;
    animation: pulse-swap 0.8s ease-in-out infinite;
  }

  @keyframes pulse-swap {
    0%, 100% {
      outline-color: rgba(var(--color-accent-rgb), 0.8);
      filter: brightness(1.1);
    }
    50% {
      outline-color: rgba(var(--color-accent-rgb), 1);
      filter: brightness(1.2);
    }
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
      min-width: 0;
    }

    .arranger__palette {
      order: 2;
      min-width: 0;
    }

    .arranger__timeline {
      min-width: 0;
      width: 100%;
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
