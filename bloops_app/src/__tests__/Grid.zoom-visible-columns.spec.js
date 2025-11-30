import { render } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Grid from '../components/Grid.svelte';
import { BASE_RESOLUTION } from '../store/projectStore.js';

const createNotes = (rows, cols) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));

describe('Grid Zoom Visible Columns', () => {
  it('should show 8 columns at zoom level 8', async () => {
    const rows = 4;
    const columns = 16;
    const stepsPerBar = 16;
    const storageColumns = columns * (BASE_RESOLUTION / stepsPerBar);
    
    const { component } = render(Grid, {
      props: {
        rows,
        columns,
        notes: createNotes(rows, storageColumns),
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        stepsPerBar,
        noteLengthDenominator: 16,
        zoomLevel: 8
      }
    });

    const windowInfo = vi.fn();
    component.$on('windowinfo', windowInfo);

    // Trigger a redraw to emit windowinfo
    component.$set({ playheadStep: 1 });
    await new Promise(resolve => setTimeout(resolve, 50));

    // At zoom 8 with stepsPerBar=16, logicalToDisplayScale = 8/16 = 0.5
    // totalDisplayColumns = 16 * 0.5 = 8
    // In jsdom, visibleColumns = 8 (MIN_VISIBLE_COLUMNS due to 0 clientWidth)
    // totalWindows = ceil(8 / 8) = 1
    expect(windowInfo).toHaveBeenCalled();
    const info = windowInfo.mock.calls[0][0].detail;
    expect(info.totalWindows).toBe(1);
  });

  it('should show 2 windows at zoom 8 with 2 bars in jsdom', async () => {
    const rows = 4;
    const columns = 32; // 2 bars × 16 steps per bar
    const stepsPerBar = 16;
    const storageColumns = columns * (BASE_RESOLUTION / stepsPerBar);
    
    const { component } = render(Grid, {
      props: {
        rows,
        columns,
        notes: createNotes(rows, storageColumns),
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        stepsPerBar,
        noteLengthDenominator: 16,
        zoomLevel: 8
      }
    });

    const windowInfo = vi.fn();
    component.$on('windowinfo', windowInfo);

    // Trigger a redraw to emit windowinfo
    component.$set({ playheadStep: 1 });
    await new Promise(resolve => setTimeout(resolve, 50));

    // At zoom 8 with stepsPerBar=16, logicalToDisplayScale = 8/16 = 0.5
    // totalDisplayColumns = 32 * 0.5 = 16
    // In jsdom, visibleColumns = 8 (MIN_VISIBLE_COLUMNS due to 0 clientWidth)
    // totalWindows = ceil(16 / 8) = 2
    expect(windowInfo).toHaveBeenCalled();
    const info = windowInfo.mock.calls[0][0].detail;
    expect(info.totalWindows).toBe(2);
  });

  it('should show 16 columns at zoom level 16', async () => {
    const rows = 4;
    const columns = 16;
    const stepsPerBar = 16;
    const storageColumns = columns * (BASE_RESOLUTION / stepsPerBar);
    
    const { component } = render(Grid, {
      props: {
        rows,
        columns,
        notes: createNotes(rows, storageColumns),
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        stepsPerBar,
        noteLengthDenominator: 16,
        zoomLevel: 16
      }
    });

    const windowInfo = vi.fn();
    component.$on('windowinfo', windowInfo);

    // Trigger a redraw to emit windowinfo
    component.$set({ playheadStep: 1 });
    await new Promise(resolve => setTimeout(resolve, 50));

    // At zoom 16, logicalToDisplayScale = 16/16 = 1
    // totalDisplayColumns = 16 * 1 = 16
    // In jsdom, visibleColumns = 8 (MIN_VISIBLE_COLUMNS due to 0 clientWidth)
    // totalWindows = ceil(16 / 8) = 2
    expect(windowInfo).toHaveBeenCalled();
    const info = windowInfo.mock.calls[0][0].detail;
    expect(info.totalWindows).toBe(2);
  });

  it('should show multiple windows at zoom level 32', async () => {
    const rows = 4;
    const columns = 16;
    const stepsPerBar = 16;
    const storageColumns = columns * (BASE_RESOLUTION / stepsPerBar);
    
    const { component } = render(Grid, {
      props: {
        rows,
        columns,
        notes: createNotes(rows, storageColumns),
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        stepsPerBar,
        noteLengthDenominator: 16,
        zoomLevel: 32
      }
    });

    const windowInfo = vi.fn();
    component.$on('windowinfo', windowInfo);

    // Trigger a redraw to emit windowinfo
    component.$set({ playheadStep: 1 });
    await new Promise(resolve => setTimeout(resolve, 50));

    // At zoom 32, logicalToDisplayScale = 32/16 = 2
    // totalDisplayColumns = 16 * 2 = 32
    // In jsdom, visibleColumns = 8 (MIN_VISIBLE_COLUMNS due to 0 clientWidth)
    // totalWindows = ceil(32 / 8) = 4
    expect(windowInfo).toHaveBeenCalled();
    const info = windowInfo.mock.calls[0][0].detail;
    expect(info.totalWindows).toBe(4);
  });

  it('should show multiple windows at zoom level 64', async () => {
    const rows = 4;
    const columns = 16;
    const stepsPerBar = 16;
    const storageColumns = columns * (BASE_RESOLUTION / stepsPerBar);
    
    const { component } = render(Grid, {
      props: {
        rows,
        columns,
        notes: createNotes(rows, storageColumns),
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        stepsPerBar,
        noteLengthDenominator: 16,
        zoomLevel: 64
      }
    });

    const windowInfo = vi.fn();
    component.$on('windowinfo', windowInfo);

    // Trigger a redraw to emit windowinfo
    component.$set({ playheadStep: 1 });
    await new Promise(resolve => setTimeout(resolve, 50));

    // At zoom 64, logicalToDisplayScale = 64/16 = 4
    // totalDisplayColumns = 16 * 4 = 64
    // In jsdom, visibleColumns = 8 (MIN_VISIBLE_COLUMNS due to 0 clientWidth)
    // totalWindows = ceil(64 / 8) = 8
    expect(windowInfo).toHaveBeenCalled();
    const info = windowInfo.mock.calls[0][0].detail;
    expect(info.totalWindows).toBe(8);
  });

  it('should have more windows at higher zoom levels', async () => {
    // This test verifies the core requirement: more windows needed at higher zoom
    // because higher zoom shows more detail (more display columns per logical step)
    const rows = 4;
    const columns = 64; // Use 4 bars to have enough space for all zoom levels
    const stepsPerBar = 16;
    const storageColumns = columns * (BASE_RESOLUTION / stepsPerBar);
    
    const results = [];
    
    for (const zoom of [8, 16, 32, 64]) {
      const { component } = render(Grid, {
        props: {
          rows,
          columns,
          notes: createNotes(rows, storageColumns),
          playheadStep: 0,
          playheadProgress: 0,
          follow: false,
          isPlaying: false,
          stepsPerBar,
          noteLengthDenominator: 16,
          zoomLevel: zoom
        }
      });

      const windowInfo = vi.fn();
      component.$on('windowinfo', windowInfo);

      // Trigger a redraw to emit windowinfo
      component.$set({ playheadStep: 1 });
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(windowInfo).toHaveBeenCalled();
      const info = windowInfo.mock.calls[0][0].detail;
      
      // Calculate expected values based on jsdom environment
      // In jsdom, visibleColumns = 8 (MIN_VISIBLE_COLUMNS)
      const visibleColumns = 8;
      const logicalToDisplayScale = zoom / stepsPerBar;
      const totalDisplayColumns = columns * logicalToDisplayScale;
      const expectedWindows = Math.ceil(totalDisplayColumns / visibleColumns);
      
      // Store for comparison
      results.push({
        zoom,
        totalWindows: info.totalWindows,
        expectedWindows,
        visibleColumns
      });
      
      // Verify the calculation matches expected
      expect(info.totalWindows).toBe(expectedWindows);
    }
    
    // Verify that higher zoom levels need more windows (more detail)
    // zoom 8: totalDisplayColumns = 64 * 0.5 = 32, windows = ceil(32/8) = 4
    // zoom 16: totalDisplayColumns = 64 * 1 = 64, windows = ceil(64/8) = 8
    // zoom 32: totalDisplayColumns = 64 * 2 = 128, windows = ceil(128/8) = 16
    // zoom 64: totalDisplayColumns = 64 * 4 = 256, windows = ceil(256/8) = 32
    expect(results[0].expectedWindows).toBe(4);
    expect(results[1].expectedWindows).toBe(8);
    expect(results[2].expectedWindows).toBe(16);
    expect(results[3].expectedWindows).toBe(32);
    
    // Verify that each higher zoom level requires more windows
    expect(results[1].totalWindows).toBeGreaterThan(results[0].totalWindows);
    expect(results[2].totalWindows).toBeGreaterThan(results[1].totalWindows);
    expect(results[3].totalWindows).toBeGreaterThan(results[2].totalWindows);
  });
});
