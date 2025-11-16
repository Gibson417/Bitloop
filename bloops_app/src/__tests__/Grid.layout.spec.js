import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Grid from '../components/Grid.svelte';

const createNotes = (rows, cols) => Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));

describe('Grid layout', () => {
  it('computes canvas width based on columns and zoom level', async () => {
    const rows = 4;
    const sourceColumns = 32; // underlying total steps
    const zoomLevel = 8; // zoom level controls grid density
    const noteLengthDenominator = 16; // note length is separate

    // jsdom doesn't implement CanvasRenderingContext2D; provide a minimal stub
    const fakeCtx = {
      save: () => {},
      restore: () => {},
      setTransform: () => {},
      clearRect: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      fillRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      arc: () => {},
      fill: () => {},
      createPattern: () => null,
      measureText: () => ({ width: 0 }),
      // allow setting style props
      set fillStyle(_) {},
      set strokeStyle(_) {},
      set lineWidth(_) {},
      set shadowColor(_) {},
      set shadowBlur(_) {},
    };
    // install on prototype so Grid's onMount can call getContext
    HTMLCanvasElement.prototype.getContext = () => fakeCtx;

    // Make clientWidth predictable for the grid wrapper during layout calculation.
    // Return 300 for elements that have 'grid-wrapper' in the class list.
    const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        try {
          return this.classList && this.classList.contains('grid-wrapper') ? 300 : (originalClientWidth && originalClientWidth.get ? originalClientWidth.get.call(this) : 0);
        } catch (e) {
          return 0;
        }
      }
    });

    const { container } = render(Grid, {
      props: {
        rows,
        columns: sourceColumns,
        notes: createNotes(rows, sourceColumns),
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        noteLengthDenominator,
        zoomLevel,
        stepsPerBar: 16
      }
    });

    const scroller = container.querySelector('.grid-wrapper');
    const canvas = container.querySelector('canvas');

    // Simulate a scroller width that influences cell sizing
    Object.defineProperty(scroller, 'clientWidth', { value: 300, configurable: true });

    // Trigger a resize by dispatching a window resize event so component recalculates layout
    window.dispatchEvent(new Event('resize'));

    // visibleColumns uses new formula: min(zoom === 8 ? 16 : zoom, sourceColumns)
    // For zoom level 8 and sourceColumns 32, visibleColumns = min(16, 32) = 16
    const visibleColumns = Math.min(zoomLevel === 8 ? 16 : zoomLevel, sourceColumns);
    const availableWidth = scroller.clientWidth;
    const expectedCellSize = Math.max(32, Math.min(96, Math.floor(availableWidth / visibleColumns)));
    // Width is now fixed to visible columns only (static grid with window switching)
    const expectedWidth = visibleColumns * expectedCellSize;

    // Allow Svelte next tick for DOM updates
    await new Promise((r) => setTimeout(r, 20));

    // cleanup clientWidth mock
    if (originalClientWidth) {
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalClientWidth);
    } else {
      delete HTMLElement.prototype.clientWidth;
    }

    expect(canvas.style.width).toBe(`${expectedWidth}px`);
  });
});
