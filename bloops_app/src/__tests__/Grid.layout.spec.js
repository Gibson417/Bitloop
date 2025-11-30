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

    // In the Grid component with scroller.clientWidth=300:
    // - 300 < 768 (mobile breakpoint), so isMobile = true, minCellSize = 28
    // - availableWidth = 300
    // - maxColumnsForWidth = floor(300/28) = 10
    // - logicalToDisplayScale = zoomLevel/stepsPerBar = 8/16 = 0.5
    // - totalDisplayColumns = 32 * 0.5 = 16
    // - rawVisibleColumns = max(8, min(10, 16)) = 10
    // - visibleColumns = floor(10/4)*4 = 8 (rounded to multiple of 4)
    // - cellSize = max(28, min(96, floor(300/8))) = max(28, min(96, 37)) = 37
    // - width = 8 * 37 = 296
    const MIN_VISIBLE_COLUMNS = 8;
    const MIN_CELL_SIZE_MOBILE = 28;
    const MAX_CELL_SIZE = 96;
    const MOBILE_BREAKPOINT = 768;
    
    const availableWidth = 300;
    const isMobile = availableWidth < MOBILE_BREAKPOINT;
    const minCellSize = isMobile ? MIN_CELL_SIZE_MOBILE : 44;
    const maxColumnsForWidth = Math.floor(availableWidth / minCellSize);
    const logicalToDisplayScale = zoomLevel / 16;
    const totalDisplayColumns = Math.floor(sourceColumns * logicalToDisplayScale);
    
    let rawVisibleColumns = Math.max(MIN_VISIBLE_COLUMNS, Math.min(maxColumnsForWidth, totalDisplayColumns));
    let visibleColumns = Math.floor(rawVisibleColumns / 4) * 4;
    if (visibleColumns < MIN_VISIBLE_COLUMNS) {
      visibleColumns = MIN_VISIBLE_COLUMNS;
    }
    
    const expectedCellSize = Math.max(minCellSize, Math.min(MAX_CELL_SIZE, Math.floor(availableWidth / visibleColumns)));
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
