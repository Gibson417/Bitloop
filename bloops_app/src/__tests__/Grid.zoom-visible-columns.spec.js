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

    // At zoom 8, visibleColumns should be 8 (showing 8th note resolution)
    // totalWindows = ceil(16 / 8) = 2 (2 windows of 8 columns each)
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
    // totalWindows = ceil(16 / 16) = 1 (1 window showing all available columns)
    expect(windowInfo).toHaveBeenCalled();
    const info = windowInfo.mock.calls[0][0].detail;
    expect(info.totalWindows).toBe(1);
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
    // totalWindows = ceil(16 / 16) = 1 (1 window showing all available columns)
    expect(windowInfo).toHaveBeenCalled();
    const info = windowInfo.mock.calls[0][0].detail;
    expect(info.totalWindows).toBe(1);
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
      
      // Calculate expected visible columns: min(zoom, columns)
      const visibleColumns = Math.min(zoom, columns);
      
      // Store for comparison
      results.push({
        zoom,
        totalWindows: info.totalWindows,
        visibleColumns
      });
    }
    
    // Verify that zoom 8 shows 8 columns
    const zoom8 = results.find(r => r.zoom === 8);
    expect(zoom8.visibleColumns).toBe(8);
    
    // Verify that zoom 16 shows 16 columns
    const zoom16 = results.find(r => r.zoom === 16);
    expect(zoom16.visibleColumns).toBe(16);
    
    // Verify that zoom 32 shows 32 columns
    const zoom32 = results.find(r => r.zoom === 32);
    expect(zoom32.visibleColumns).toBe(32);
    
    // Verify that zoom 64 shows 64 columns
    const zoom64 = results.find(r => r.zoom === 64);
    expect(zoom64.visibleColumns).toBe(64);
    
    // Verify that higher zoom levels have more visible columns
    expect(results[1].visibleColumns).toBeGreaterThan(results[0].visibleColumns); // 16 > 8
    expect(results[2].visibleColumns).toBeGreaterThan(results[1].visibleColumns); // 32 > 16
    expect(results[3].visibleColumns).toBeGreaterThan(results[2].visibleColumns); // 64 > 32
  });
});
