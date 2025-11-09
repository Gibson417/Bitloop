<script>
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { colors } from '../lib/colorTokens.js';

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

  const dispatch = createEventDispatcher();

  let canvas;
  let scroller;
  let ctx;
  let layout = { cellSize: 32, width: 0, height: 0, dpr: 1 };
  let pointerActive = false;
  let paintValue = true;
  let paintedCells = new Set();
  let resizeObserver;

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
    if (!canvas || !scroller) return;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const visibleColumns = Math.min(columns, 16);
    const availableWidth = scroller.clientWidth || columns * 32;
    const cellSize = Math.max(18, Math.min(48, Math.floor(availableWidth / visibleColumns)));
    const width = Math.max(columns * cellSize, availableWidth);
    const height = rows * cellSize;

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
    const styles = getStyles();
    ctx.clearRect(0, 0, layout.width, layout.height);
    const backgroundGradient = ctx.createLinearGradient(0, 0, 0, layout.height);
    backgroundGradient.addColorStop(0, styles.background);
    backgroundGradient.addColorStop(1, 'rgba(14, 16, 22, 0.92)');
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, layout.width, layout.height);

    const barWidth = Math.max(stepsPerBar, 1) * layout.cellSize;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let col = 0; col < columns; col += stepsPerBar) {
      const x = col * layout.cellSize;
      const stripe = ctx.createLinearGradient(x, 0, x + layout.cellSize * 1.5, 0);
      stripe.addColorStop(0, hexToRgba(trackColor, 0.08));
      stripe.addColorStop(1, 'transparent');
      ctx.fillStyle = stripe;
      ctx.fillRect(x, 0, layout.cellSize * 1.5, layout.height);

      const wash = ctx.createLinearGradient(x, 0, x + barWidth, 0);
      wash.addColorStop(0, hexToRgba(trackColor, 0.04));
      wash.addColorStop(1, 'transparent');
      ctx.fillStyle = wash;
      ctx.fillRect(x, 0, barWidth, layout.height);
    }
    ctx.restore();

    const radius = layout.cellSize * 0.28;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const active = notes?.[row]?.[col];
        const cx = col * layout.cellSize + layout.cellSize / 2;
        const cy = row * layout.cellSize + layout.cellSize / 2;
        ctx.beginPath();
        const inactive = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
        inactive.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        inactive.addColorStop(1, styles.inactive);
        if (active) {
          ctx.shadowColor = hexToRgba(trackColor, 0.7);
          ctx.shadowBlur = layout.cellSize * 0.5;
          ctx.fillStyle = hexToRgba(trackColor, 0.9);
        } else {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.fillStyle = inactive;
        }
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        if (active) {
          ctx.beginPath();
          ctx.fillStyle = hexToRgba(trackColor, 0.45);
          ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const playheadX = (playheadStep + playheadProgress) * layout.cellSize;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    const playheadGlow = ctx.createLinearGradient(playheadX - layout.cellSize, 0, playheadX + layout.cellSize, 0);
    playheadGlow.addColorStop(0, 'transparent');
    playheadGlow.addColorStop(0.5, hexToRgba(trackColor, 0.2));
    playheadGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = playheadGlow;
    ctx.fillRect(playheadX - layout.cellSize, 0, layout.cellSize * 2, layout.height);
    ctx.strokeStyle = styles.playhead;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, layout.height);
    ctx.stroke();
  };

  const getCellFromEvent = (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const col = Math.floor(x / layout.cellSize);
    const row = Math.floor(y / layout.cellSize);
    if (row < 0 || row >= rows || col < 0 || col >= columns) {
      return null;
    }
    return { row, col };
  };

  const emitNoteChange = (row, col, value) => {
    dispatch('notechange', { row, step: col, value });
  };

  const handlePointer = (event) => {
    if (!pointerActive && event.type === 'pointermove') return;
    const cell = getCellFromEvent(event);
    if (!cell) return;
    const key = `${cell.row}:${cell.col}`;
    if (paintedCells.has(key)) return;
    paintedCells.add(key);
    if (!pointerActive) {
      pointerActive = true;
      paintValue = !(notes?.[cell.row]?.[cell.col]);
    }
    emitNoteChange(cell.row, cell.col, paintValue);
  };

  const handlePointerDown = (event) => {
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    pointerActive = false;
    paintedCells = new Set();
    handlePointer(event);
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

  $: if (canvas && scroller && ctx && columns && rows) {
    updateLayout();
  }

  $: draw();

  $: if (follow && isPlaying && scroller) {
    const playheadX = (playheadStep + playheadProgress) * layout.cellSize;
    const center = playheadX - scroller.clientWidth / 2;
    const target = Math.max(0, center);
    if (Math.abs(scroller.scrollLeft - target) > 2) {
      scroller.scrollTo({ left: target, behavior: 'smooth' });
    }
  }
</script>

<div class="grid-container">
  <div class="note-labels">
    {#each noteLabels as label, index (index)}
      <div class="note-label" style="color: {hexToRgba(trackColor, 0.8)};">
        {label}
      </div>
    {/each}
  </div>
  <div class="grid-wrapper" bind:this={scroller}>
    <canvas
      class="grid-canvas"
      bind:this={canvas}
      on:pointerdown={handlePointerDown}
      on:pointermove={handlePointerMove}
      on:pointerup={handlePointerUp}
      on:pointerleave={handlePointerCancel}
      on:pointercancel={handlePointerCancel}
    ></canvas>
  </div>
</div>

<style>
  .grid-container {
    display: flex;
    width: 100%;
    height: 100%;
    gap: 8px;
  }

  .note-labels {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    padding: 8px 0;
    min-width: 48px;
    background: rgba(22, 26, 36, 0.6);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .note-label {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-align: center;
    flex: 1;
    min-height: 0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .grid-wrapper {
    position: relative;
    flex: 1;
    height: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    background: var(--color-panel);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .grid-canvas {
    touch-action: none;
    cursor: crosshair;
    display: block;
  }
</style>
