<script>
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { colors } from '../lib/colorTokens.js';
  import { BASE_RESOLUTION } from '../store/projectStore.js';

  export let notes = [];
  export let rows = 8;
  export let columns = 16;
  export let stepsPerBar = 16;
  export let playheadStep = 0;
  export let playheadProgress = 0;
  export let trackColor = colors.accent;
  export let follow = true;
  export let isPlaying = false;
  export let noteLabels = [];
  // noteLengthDenominator: e.g. 16 for 1/16, 32 for 1/32, 64 for 1/64
  export let noteLengthSteps = 1; // backwards-compat (grouping factor)
  export let noteLengthDenominator = undefined;

  const dispatch = createEventDispatcher();

  let canvas;
  let scroller;
  let ctx;
  let layout = { cellSize: 32, width: 0, height: 0, dpr: 1 };
  let pointerActive = false;
  let paintValue = true;
  let paintedCells = new Set();
  let resizeObserver;
  
  // Keyboard navigation state
  let focusedRow = 0;
  let focusedCol = 0;
  let keyboardMode = false;

  const hexToRgba = (hex, alpha = 1) => {
    const fallback = hex ?? colors.accent;
    const clean = fallback.replace('#', '');
    const bigint = parseInt(clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getStyles = () => {
    const style = getComputedStyle(canvas);
    return {
      background: style.getPropertyValue('--color-panel')?.trim() || colors.panel,
      grid: style.getPropertyValue('--color-grid-line')?.trim() || 'rgba(255,255,255,0.08)',
      inactive:
        style.getPropertyValue('--color-note-inactive')?.trim() || colors.noteInactive,
      playhead:
        style.getPropertyValue('--color-playhead')?.trim() || hexToRgba(trackColor, 0.9)
    };
  };

  const updateLayout = () => {
    if (!canvas || !scroller) {
      return;
    }
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const safeRows = Math.max(rows || 8, 1);
    const logicalColumns = Math.max(columns || 16, 1); // logical total steps (bars * stepsPerBar)
    const stepsPerBarSafe = Math.max(stepsPerBar || 16, 1);
    const denom = Number(noteLengthDenominator) || null;
    const displayColumns = denom && Number.isFinite(denom) && denom > 0
      ? Math.max(1, Math.floor((logicalColumns * denom) / stepsPerBarSafe))
      : Math.max(1, Math.floor(logicalColumns / Math.max(1, Math.round(noteLengthSteps || 1))));
    // storageColumns is high-res internal storage length (bars * BASE_RESOLUTION)
    const storageColumns = Math.max(1, Math.floor(logicalColumns * (BASE_RESOLUTION / stepsPerBarSafe)));
    const visibleColumns = Math.min(displayColumns, 16);
    const availableWidth = scroller.clientWidth || displayColumns * 32;
    const cellSize = Math.max(18, Math.min(48, Math.floor(availableWidth / visibleColumns)));
    const width = Math.max(displayColumns * cellSize, availableWidth);
    const height = safeRows * cellSize;

    layout = { cellSize, width, height, dpr };

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    if (!ctx) {
      ctx = canvas.getContext('2d');
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  };

    const draw = () => {
      if (!ctx) return;
      const safeRows = Math.max(rows || 8, 1);
      const safeColumns = Math.max(columns || 16, 1);
      // ...existing code...
      const styles = getStyles();
      ctx.clearRect(0, 0, layout.width, layout.height);
      const backgroundGradient = ctx.createLinearGradient(0, 0, 0, layout.height);
      backgroundGradient.addColorStop(0, styles.background);
      backgroundGradient.addColorStop(1, 'rgba(14, 16, 22, 0.92)');
      ctx.fillStyle = backgroundGradient;
      ctx.fillRect(0, 0, layout.width, layout.height);

      // Calculate display columns based on selected note denominator (e.g. 16,32,64) and storage mapping.
      const logicalColumns = Math.max(columns || 16, 1);
      const stepsPerBarSafe = Math.max(stepsPerBar || 16, 1);
      const denom = Number(noteLengthDenominator) || null;
      const displayColumns = denom && Number.isFinite(denom) && denom > 0
        ? Math.max(1, Math.floor((logicalColumns * denom) / stepsPerBarSafe))
        : Math.max(1, Math.floor(logicalColumns / Math.max(1, Math.round(noteLengthSteps || 1))));
      const storageColumns = Math.max(1, Math.floor(logicalColumns * (BASE_RESOLUTION / stepsPerBarSafe)));
      const cellSize = layout.cellSize;

      // Draw grid lines
      ctx.save();
      ctx.strokeStyle = hexToRgba(trackColor, 0.18);
      ctx.lineWidth = 1;
      for (let col = 0; col <= displayColumns; col++) {
        const x = col * cellSize + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, layout.height);
        ctx.stroke();
      }
      for (let row = 0; row <= rows; row++) {
        const y = row * cellSize + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(layout.width, y);
        ctx.stroke();
      }
      ctx.restore();

      // Draw notes (map displayed column -> underlying step index)
      ctx.save();
      for (let row = 0; row < rows; row++) {
      for (let col = 0; col < displayColumns; col++) {
        // Map displayed column -> underlying storage step index range
        const storageStart = Math.floor((col * storageColumns) / displayColumns);
        const storageEnd = Math.floor(((col + 1) * storageColumns) / displayColumns);
        // Check if ANY cell in the storage range is active (fixes display for mixed resolutions)
        const rowNotes = notes?.[row] ?? [];
        const isActive = rowNotes.slice(storageStart, storageEnd).some(Boolean);
          const cx = col * cellSize + cellSize / 2;
          const cy = row * cellSize + cellSize / 2;
          const radius = cellSize * 0.28;

          const inactive = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
          inactive.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
          inactive.addColorStop(1, styles.inactive);

          if (isActive) {
            ctx.shadowColor = hexToRgba(trackColor, 0.7);
            ctx.shadowBlur = cellSize * 0.5;
            ctx.fillStyle = hexToRgba(trackColor, 0.9);
          } else {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.fillStyle = inactive;
          }
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();

          if (isActive) {
            ctx.beginPath();
            ctx.fillStyle = hexToRgba(trackColor, 0.45);
            ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();

      // Draw keyboard focus indicator
      if (keyboardMode) {
        ctx.save();
        ctx.strokeStyle = hexToRgba(trackColor, 0.9);
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 4]);
        const focusX = focusedCol * cellSize;
        const focusY = focusedRow * cellSize;
        ctx.strokeRect(focusX + 2, focusY + 2, cellSize - 4, cellSize - 4);
        ctx.restore();
      }

  // Playhead (map logical playhead -> displayed column then to pixels)
  const playheadX = ((playheadStep + playheadProgress) * (displayColumns / Math.max(1, columns))) * layout.cellSize;
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      const glowIntensity = isPlaying ? 0.3 + Math.sin(Date.now() * 0.003) * 0.1 : 0.2;
      const glowWidth = layout.cellSize * (isPlaying ? 2.5 : 1.5);
      const playheadGlow = ctx.createLinearGradient(playheadX - glowWidth, 0, playheadX + glowWidth, 0);
      playheadGlow.addColorStop(0, 'transparent');
      playheadGlow.addColorStop(0.5, hexToRgba(trackColor, glowIntensity));
      playheadGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = playheadGlow;
      ctx.fillRect(playheadX - glowWidth, 0, glowWidth * 2, layout.height);
      ctx.strokeStyle = styles.playhead;
      ctx.lineWidth = isPlaying ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, layout.height);
      ctx.stroke();
      if (isPlaying) {
        ctx.shadowColor = hexToRgba(trackColor, 0.5);
        ctx.shadowBlur = 8;
        ctx.strokeStyle = hexToRgba(trackColor, 0.8);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, layout.height);
        ctx.stroke();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
    };

  const handlePointerDown = (event) => {
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    pointerActive = true;
    paintedCells = new Set();
    handlePointer(event);
  };

  const handlePointer = (event) => {
    if (!canvas || !scroller) return;
    const rect = canvas.getBoundingClientRect();
    // account for scroller horizontal scroll
    const scrollLeft = scroller.scrollLeft || 0;
    const x = (event.clientX - rect.left) + scrollLeft;
    const y = event.clientY - rect.top;

    const col = Math.floor(x / layout.cellSize);
    const row = Math.floor(y / layout.cellSize);
    if (row < 0 || row >= rows || col < 0) return;

    const sourceColumns = Math.max(columns || 16, 1);
    const stepsPerBarSafe = Math.max(stepsPerBar || 16, 1);
    const denom = Number(noteLengthDenominator) || null;
    const displayColumns = denom && Number.isFinite(denom) && denom > 0
      ? Math.max(1, Math.floor((sourceColumns * denom) / stepsPerBarSafe))
      : Math.max(1, Math.floor(sourceColumns / Math.max(1, Math.round(noteLengthSteps || 1))));
    if (col >= displayColumns) return;

    const stepIndex = Math.floor((col * sourceColumns) / displayColumns);

    // Compute storage indices for the start and length so the event carries
    // high-resolution (internal) indices rather than logical indices.
    const storagePerLogical = BASE_RESOLUTION / Math.max(1, stepsPerBarSafe);
    const storageStart = Math.max(0, Math.floor(stepIndex * storagePerLogical));

    // logical visible width of this displayed column (in logical steps)
    const logicalColWidth = Math.max(1, Math.round(sourceColumns / displayColumns));
    const storageLength = Math.max(1, Math.round(logicalColWidth * storagePerLogical));

    // Determine current state at the underlying storage slice we're about to modify
    const sliceStart = storageStart;
    const sliceEnd = storageStart + storageLength;
    const currentSlice = (notes?.[row] ?? []).slice(sliceStart, sliceEnd);
    // Use some(Boolean) instead of every(Boolean) to detect if ANY part has notes
    // This fixes erasing when notes were placed at different resolutions
    const current = currentSlice.length > 0 && currentSlice.some(Boolean);
    if (!pointerActive) {
      pointerActive = true;
      paintValue = !current;
    }

    const key = `${row}:${storageStart}`;
    if (paintedCells.has(key)) return;
    paintedCells.add(key);

    // Dispatch notechange using storage indices: { row, start, length, value, storage: true }
    // The `storage: true` flag helps consumers know start/length are high-resolution indices.
    dispatch('notechange', { row, start: storageStart, length: storageLength, value: paintValue, storage: true });
  };

  const handlePointerMove = (event) => {
    if (!pointerActive) return;
    handlePointer(event);
  };

  const releasePointer = (event) => {
    if (canvas) {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch (e) {
        // Ignore if capture was not set.
      }
    }
    pointerActive = false;
    paintedCells = new Set();
  };

  const handlePointerUp = (event) => {
    releasePointer(event);
  };

  const handlePointerCancel = (event) => {
    releasePointer(event);
  };

  // Keyboard navigation handlers
  const handleKeyDown = (event) => {
    if (!canvas || !scroller) return;
    
    const sourceColumns = Math.max(columns || 16, 1);
    const stepsPerBarSafe = Math.max(stepsPerBar || 16, 1);
    const denom = Number(noteLengthDenominator) || null;
    const displayColumns = denom && Number.isFinite(denom) && denom > 0
      ? Math.max(1, Math.floor((sourceColumns * denom) / stepsPerBarSafe))
      : Math.max(1, Math.floor(sourceColumns / Math.max(1, Math.round(noteLengthSteps || 1))));

    // Arrow keys for navigation
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      keyboardMode = true;
      focusedRow = Math.max(0, focusedRow - 1);
      draw();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      keyboardMode = true;
      focusedRow = Math.min(rows - 1, focusedRow + 1);
      draw();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      keyboardMode = true;
      focusedCol = Math.max(0, focusedCol - 1);
      // Scroll to keep focused cell visible
      const focusX = focusedCol * layout.cellSize;
      if (focusX < scroller.scrollLeft) {
        scroller.scrollLeft = focusX - layout.cellSize;
      }
      draw();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      keyboardMode = true;
      focusedCol = Math.min(displayColumns - 1, focusedCol + 1);
      // Scroll to keep focused cell visible
      const focusX = (focusedCol + 1) * layout.cellSize;
      if (focusX > scroller.scrollLeft + scroller.clientWidth) {
        scroller.scrollLeft = focusX - scroller.clientWidth + layout.cellSize;
      }
      draw();
    } else if (event.key === ' ' || event.key === 'Enter') {
      // Space or Enter to toggle note at focused cell
      event.preventDefault();
      keyboardMode = true;
      
      const storageColumns = Math.max(1, Math.floor(sourceColumns * (BASE_RESOLUTION / stepsPerBarSafe)));
      const storageStart = Math.floor((focusedCol * storageColumns) / displayColumns);
      const logicalColWidth = Math.max(1, Math.round(sourceColumns / displayColumns));
      const storagePerLogical = BASE_RESOLUTION / Math.max(1, stepsPerBarSafe);
      const storageLength = Math.max(1, Math.round(logicalColWidth * storagePerLogical));
      
      // Get current state of the cell - use some() to detect ANY active notes
      const sliceStart = storageStart;
      const sliceEnd = storageStart + storageLength;
      const currentSlice = (notes?.[focusedRow] ?? []).slice(sliceStart, sliceEnd);
      const current = currentSlice.length > 0 && currentSlice.some(Boolean);
      
      // Toggle the note
      dispatch('notechange', { 
        row: focusedRow, 
        start: storageStart, 
        length: storageLength, 
        value: !current, 
        storage: true 
      });
    }
  };

  const handleCanvasFocus = () => {
    // When canvas receives focus via tab, enable keyboard mode
    keyboardMode = true;
    draw();
  };

  const handleCanvasBlur = () => {
    // When canvas loses focus, disable keyboard mode
    keyboardMode = false;
    draw();
  };

  const handleCanvasClick = () => {
    // When clicked, disable keyboard mode (pointer takes over)
    keyboardMode = false;
  };

  onMount(() => {
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    updateLayout();
    
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateLayout());
      if (scroller) resizeObserver.observe(scroller);
    }
    const handleWindowResize = () => updateLayout();
    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  });

  onDestroy(() => {
    if (resizeObserver && scroller) {
      resizeObserver.unobserve(scroller);
      resizeObserver.disconnect();
    }
  });

  $: drawTrigger = {
    notes,
    playheadStep,
    playheadProgress,
    trackColor,
    isPlaying,
    stepsPerBar,
    noteLengthSteps,
    columns,
    rows
  };

  $: if (canvas && scroller && columns && rows) {
    if (!ctx && canvas) {
      ctx = canvas.getContext('2d');
    }
    if (ctx) {
      updateLayout();
    }
  }

  $: if (ctx) {
    drawTrigger;
    draw();
  }

  $: if (follow && isPlaying && scroller) {
    const sourceColumns = Math.max(columns || 16, 1);
    const stepsPerBarSafe = Math.max(stepsPerBar || 16, 1);
    const denom = Number(noteLengthDenominator) || null;
    const displayColumns = denom && Number.isFinite(denom) && denom > 0
      ? Math.max(1, Math.floor((sourceColumns * denom) / stepsPerBarSafe))
      : Math.max(1, Math.floor(sourceColumns / Math.max(1, Math.round(noteLengthSteps || 1))));
    const playheadX = ((playheadStep + playheadProgress) * (displayColumns / sourceColumns)) * layout.cellSize;
    const center = playheadX - scroller.clientWidth / 2;
    const target = Math.max(0, center);
    if (Math.abs(scroller.scrollLeft - target) > 2) {
      scroller.scrollTo({ left: target, behavior: 'smooth' });
    }
  }
</script>

<div class="grid-container">
  <div class="note-labels" style={`height: ${layout.height || 256}px`}>
    {#if noteLabels.length === 0}
      <div class="note-label" style={`color: rgba(255,255,255,0.5); height: 32px;`}>
        Loading...
      </div>
    {/if}
    {#each noteLabels as label, index (index)}
      <div
        class="note-label"
        style={`color: ${hexToRgba(trackColor, 0.8)}; height: ${layout.cellSize}px;`}
      >
        {label}
      </div>
    {/each}
  </div>
  <div class="grid-wrapper" bind:this={scroller}>
    {#if !canvas}
      <div style="color: white; padding: 20px;">Grid initializing...</div>
    {/if}
    <canvas
      class="grid-canvas"
      bind:this={canvas}
      tabindex="0"
      role="grid"
      aria-label="Note grid - use arrow keys to navigate, space or enter to toggle notes"
      on:pointerdown={handlePointerDown}
      on:pointermove={handlePointerMove}
      on:pointerup={handlePointerUp}
      on:pointerleave={handlePointerCancel}
      on:pointercancel={handlePointerCancel}
      on:keydown={handleKeyDown}
      on:focus={handleCanvasFocus}
      on:blur={handleCanvasBlur}
      on:click={handleCanvasClick}
    ></canvas>
  </div>
</div>

<style>
  .grid-container {
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 256px;
    gap: 8px;
  }

  .note-labels {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    padding: 0;
    min-width: 48px;
    background: rgba(22, 26, 36, 0.6);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    overflow: hidden;
  }

  .note-label {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-align: center;
    flex: 0 0 auto;
    min-height: 32px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .grid-wrapper {
    position: relative;
    flex: 1;
    height: 100%;
    min-height: 256px;
    overflow-x: auto;
    overflow-y: hidden;
    background: var(--color-panel);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    scrollbar-color: rgba(var(--color-accent-rgb), 0.4) rgba(0, 0, 0, 0.4);
    scrollbar-width: thin;
  }

  .grid-canvas {
    touch-action: none;
    cursor: crosshair;
    display: block;
    min-width: 512px;
    min-height: 256px;
    /* Reset debug visuals */
    background: transparent;
    border: none;
    outline: none;
  }

  .grid-canvas:focus-visible {
    outline: 3px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: -3px;
    border-radius: 8px;
  }

  .grid-wrapper::-webkit-scrollbar {
    height: 10px;
  }

  .grid-wrapper::-webkit-scrollbar-track {
    background: rgba(12, 14, 20, 0.55);
    border-radius: 999px;
  }

  .grid-wrapper::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.65), rgba(var(--color-note-active-rgb), 0.55));
    border-radius: 999px;
    border: 2px solid rgba(12, 14, 20, 0.55);
  }

  .grid-wrapper::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.85), rgba(var(--color-note-active-rgb), 0.75));
  }
</style>
