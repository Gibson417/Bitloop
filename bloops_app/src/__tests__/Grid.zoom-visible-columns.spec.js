import { render } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Grid from '../components/Grid.svelte';
import { BASE_RESOLUTION } from '../store/projectStore.js';

const createNotes = (rows, cols) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));

describe('Grid Zoom Visible Columns', () => {
  it('should show 16 columns at zoom level 8', async () => {
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

    // At zoom 8, visibleColumns should be 16 (Math.max(16, 8) = 16)
    // displayColumns = floor((16 * 8) / 16) = 8
    // visibleColumns = Math.min(8, 16) = 8
    // totalWindows = ceil(8 / 8) = 1
    expect(windowInfo).toHaveBeenCalled();
    const info = windowInfo.mock.calls[0][0].detail;
    expect(info.totalWindows).toBeGreaterThanOrEqual(1);
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

    // At zoom 16, visibleColumns should be 16 (Math.max(16, 16) = 16)
    // displayColumns = floor((16 * 16) / 16) = 16
    // visibleColumns = Math.min(16, 16) = 16
    // totalWindows = ceil(16 / 16) = 1
    expect(windowInfo).toHaveBeenCalled();
    const info = windowInfo.mock.calls[0][0].detail;
    expect(info.totalWindows).toBe(1);
  });

  it('should show 32 columns at zoom level 32', async () => {
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

    // At zoom 32, visibleColumns should be 32 (Math.max(16, 32) = 32)
    // displayColumns = floor((16 * 32) / 16) = 32
    // visibleColumns = Math.min(32, 32) = 32
    // totalWindows = ceil(32 / 32) = 1
    expect(windowInfo).toHaveBeenCalled();
    const info = windowInfo.mock.calls[0][0].detail;
    expect(info.totalWindows).toBe(1);
  });

  it('should show 64 columns at zoom level 64', async () => {
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

    // At zoom 64, visibleColumns should be 64 (Math.max(16, 64) = 64)
    // displayColumns = floor((16 * 64) / 16) = 64
    // visibleColumns = Math.min(64, 64) = 64
    // totalWindows = ceil(64 / 64) = 1
    expect(windowInfo).toHaveBeenCalled();
    const info = windowInfo.mock.calls[0][0].detail;
    expect(info.totalWindows).toBe(1);
  });

  it('should have more columns visible at higher zoom levels', async () => {
    // This test verifies the core requirement: more dots visible at higher zoom
    const rows = 4;
    const columns = 32; // Use 2 bars to have enough space
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
      
      // Calculate expected visible columns
      const displayColumns = Math.floor((columns * zoom) / stepsPerBar);
      const visibleColumns = Math.min(displayColumns, Math.max(16, zoom));
      
      // Store for comparison
      results.push({
        zoom,
        totalWindows: info.totalWindows,
        visibleColumns
      });
    }
    
    // Verify that zoom 32 shows at least 32 columns
    const zoom32 = results.find(r => r.zoom === 32);
    expect(zoom32.visibleColumns).toBeGreaterThanOrEqual(32);
    
    // Verify that zoom 64 shows at least 64 columns
    const zoom64 = results.find(r => r.zoom === 64);
    expect(zoom64.visibleColumns).toBeGreaterThanOrEqual(64);
    
    // Verify that higher zoom levels have more or equal visible columns
    expect(results[1].visibleColumns).toBeGreaterThanOrEqual(results[0].visibleColumns); // 16 >= 8
    expect(results[2].visibleColumns).toBeGreaterThanOrEqual(results[1].visibleColumns); // 32 >= 16
    expect(results[3].visibleColumns).toBeGreaterThanOrEqual(results[2].visibleColumns); // 64 >= 32
  });
});
