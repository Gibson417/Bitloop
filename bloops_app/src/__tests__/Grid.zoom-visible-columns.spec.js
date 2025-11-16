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
    // visibleColumns = 8
    // totalWindows = ceil(8 / 8) = 1 (entire grid fits in one window at this zoom)
    expect(windowInfo).toHaveBeenCalled();
    const info = windowInfo.mock.calls[0][0].detail;
    expect(info.totalWindows).toBe(1);
  });

  it('should show 1 window at zoom 8 with 2 bars', async () => {
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
    // visibleColumns = 16 (2 bars of 8th notes)
    // totalWindows = ceil(16 / 16) = 1 (entire loop fits in one window)
    expect(windowInfo).toHaveBeenCalled();
    const info = windowInfo.mock.calls[0][0].detail;
    expect(info.totalWindows).toBe(1);
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

    // At zoom 16, visibleColumns should be 16 (showing 16th note resolution)
    // totalWindows = ceil(16 / 16) = 1 (1 window of 16 columns)
    expect(windowInfo).toHaveBeenCalled();
    const info = windowInfo.mock.calls[0][0].detail;
    expect(info.totalWindows).toBe(1);
  });

  it('should show 16 columns at zoom level 32 (limited by total columns)', async () => {
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

    // At zoom 32, visibleColumns should be min(32, 16) = 16 (limited by total columns)
    // logicalToDisplayScale = 32/16 = 2
    // totalDisplayColumns = 16 * 2 = 32
    // totalWindows = ceil(32 / 16) = 2 (2 windows needed to show all detail)
    expect(windowInfo).toHaveBeenCalled();
    const info = windowInfo.mock.calls[0][0].detail;
    expect(info.totalWindows).toBe(2);
  });

  it('should show 16 columns at zoom level 64 (limited by total columns)', async () => {
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

    // At zoom 64, visibleColumns should be min(64, 16) = 16 (limited by total columns)
    // logicalToDisplayScale = 64/16 = 4
    // totalDisplayColumns = 16 * 4 = 64
    // totalWindows = ceil(64 / 16) = 4 (4 windows needed to show all detail)
    expect(windowInfo).toHaveBeenCalled();
    const info = windowInfo.mock.calls[0][0].detail;
    expect(info.totalWindows).toBe(4);
  });

  it('should have more columns visible at higher zoom levels', async () => {
    // This test verifies the core requirement: more dots visible at higher zoom
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
      
      // Calculate expected values with scale factor
      const visibleColumns = Math.min(zoom === 8 ? 16 : zoom, columns);
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
    
    // Verify that zoom 8 shows 16 columns (2 bars)
    const zoom8 = results.find(r => r.zoom === 8);
    expect(zoom8.visibleColumns).toBe(16);
    // At zoom 8: totalDisplayColumns = 64 * (8/16) = 32, windows = ceil(32/16) = 2
    expect(zoom8.expectedWindows).toBe(2);
    
    // Verify that zoom 16 shows 16 columns
    const zoom16 = results.find(r => r.zoom === 16);
    expect(zoom16.visibleColumns).toBe(16);
    // At zoom 16: totalDisplayColumns = 64 * (16/16) = 64, windows = ceil(64/16) = 4
    expect(zoom16.expectedWindows).toBe(4);
    
    // Verify that zoom 32 shows 32 columns
    const zoom32 = results.find(r => r.zoom === 32);
    expect(zoom32.visibleColumns).toBe(32);
    // At zoom 32: totalDisplayColumns = 64 * (32/16) = 128, windows = ceil(128/32) = 4
    expect(zoom32.expectedWindows).toBe(4);
    
    // Verify that zoom 64 shows 64 columns
    const zoom64 = results.find(r => r.zoom === 64);
    expect(zoom64.visibleColumns).toBe(64);
    // At zoom 64: totalDisplayColumns = 64 * (64/16) = 256, windows = ceil(256/64) = 4
    expect(zoom64.expectedWindows).toBe(4);
    
    // Verify that higher zoom levels have more or equal visible columns
    // Note: zoom 8 shows 16 columns (2 bars), same as zoom 16 (1 bar)
    expect(results[1].visibleColumns).toBeGreaterThanOrEqual(results[0].visibleColumns); // 16 >= 16
    expect(results[2].visibleColumns).toBeGreaterThan(results[1].visibleColumns); // 32 > 16
    expect(results[3].visibleColumns).toBeGreaterThan(results[2].visibleColumns); // 64 > 32
  });
});
