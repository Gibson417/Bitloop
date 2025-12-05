import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Grid from '../components/Grid.svelte';
import { BASE_RESOLUTION } from '../store/projectStore.js';

const createNotes = (rows, cols) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));

describe('Grid drag note placement', () => {
  it('should place 8th notes at correct intervals when dragging on 16-step grid', async () => {
    const rows = 4;
    const columns = 16; // 16 logical columns (16 steps per bar)
    const stepsPerBar = 16;
    const storageColumns = columns * (BASE_RESOLUTION / stepsPerBar); // 64 storage steps
    
    const { component, container } = render(Grid, {
      props: {
        rows,
        columns,
        notes: createNotes(rows, storageColumns),
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        stepsPerBar,
        noteLengthDenominator: 8, // 8th notes
        zoomLevel: 16 // 16-step grid (standard resolution)
      }
    });

    const noteChange = vi.fn();
    component.$on('notechange', noteChange);

    const canvas = container.querySelector('canvas');
    // In jsdom, scroller.clientWidth = 0, so:
    // availableWidth = 8 * 28 = 224, visibleColumns = 8, cellSize = 28
    const cellSize = 28;
    const canvasWidth = 8 * cellSize; // 224px
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: canvasWidth, height: rows * cellSize });
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();

    // Drag from dot 1 (column 0) to dot 3 (column 2)
    // Start at column 0, center of cell
    await fireEvent.pointerDown(canvas, { clientX: cellSize * 0.5, clientY: 10, pointerId: 1 });
    
    // Move to column 1, center of cell
    await fireEvent.pointerMove(canvas, { clientX: cellSize * 1.5, clientY: 10, pointerId: 1 });
    
    // Move to column 2, center of cell
    await fireEvent.pointerMove(canvas, { clientX: cellSize * 2.5, clientY: 10, pointerId: 1 });
    
    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    // An 8th note should span 2 logical columns (16/8 = 2)
    // So when dragging, we should place notes at:
    // - Column 0 (dot 1): spans columns 0-1
    // - Column 2 (dot 3): spans columns 2-3
    // 
    // We should NOT place a note at column 1 (dot 2) because that would overlap
    // with the note starting at column 0
    
    // With BASE_RESOLUTION=64, stepsPerBar=16, zoomLevel=16:
    // storagePerDisplay = 64/16 = 4
    // 8th note = 64/8 = 8 storage steps (with gap: 7 storage steps)
    // Column 0: storageStart = 0, noteEnd = 7
    // Column 1: storageStart = 4, noteEnd = 11 (OVERLAPS with column 0, should be skipped)
    // Column 2: storageStart = 8, noteEnd = 15 (does not overlap, should be placed)
    
    expect(noteChange).toHaveBeenCalledTimes(2); // Only columns 0 and 2
    
    const call0 = noteChange.mock.calls[0][0].detail;
    const call1 = noteChange.mock.calls[1][0].detail;
    
    expect(call0.start).toBe(0); // Column 0
    expect(call0.length).toBe(7); // 8th note with articulation gap
    expect(call0.value).toBe(true);
    
    expect(call1.start).toBe(8); // Column 2 (skipped column 1 due to overlap)
    expect(call1.length).toBe(7);
    expect(call1.value).toBe(true);
  });

  it('should place quarter notes at correct intervals when dragging on 16-step grid', async () => {
    const rows = 4;
    const columns = 16;
    const stepsPerBar = 16;
    const storageColumns = columns * (BASE_RESOLUTION / stepsPerBar);
    
    const { component, container } = render(Grid, {
      props: {
        rows,
        columns,
        notes: createNotes(rows, storageColumns),
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        stepsPerBar,
        noteLengthDenominator: 4, // Quarter notes
        zoomLevel: 16
      }
    });

    const noteChange = vi.fn();
    component.$on('notechange', noteChange);

    const canvas = container.querySelector('canvas');
    // In jsdom, scroller.clientWidth = 0, so:
    // availableWidth = 8 * 28 = 224, visibleColumns = 8, cellSize = 28
    const cellSize = 28;
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 8 * cellSize, height: rows * cellSize });
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();

    // Drag from column 0 to column 7 (8 columns, but in jsdom only 8 visible)
    // Since visibleColumns=8 in jsdom, column 7 is at the edge
    await fireEvent.pointerDown(canvas, { clientX: cellSize * 0.5, clientY: 10, pointerId: 1 });
    await fireEvent.pointerMove(canvas, { clientX: cellSize * 1.5, clientY: 10, pointerId: 1 });
    await fireEvent.pointerMove(canvas, { clientX: cellSize * 2.5, clientY: 10, pointerId: 1 });
    await fireEvent.pointerMove(canvas, { clientX: cellSize * 3.5, clientY: 10, pointerId: 1 });
    await fireEvent.pointerMove(canvas, { clientX: cellSize * 4.5, clientY: 10, pointerId: 1 });
    await fireEvent.pointerMove(canvas, { clientX: cellSize * 5.5, clientY: 10, pointerId: 1 });
    await fireEvent.pointerMove(canvas, { clientX: cellSize * 6.5, clientY: 10, pointerId: 1 });
    await fireEvent.pointerMove(canvas, { clientX: cellSize * 7.5, clientY: 10, pointerId: 1 });
    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    // A quarter note should span 4 logical columns (16/4 = 4)
    // So when dragging across 8 columns, we should place notes at:
    // - Column 0 (spans 0-3)
    // - Column 4 (spans 4-7)
    // 
    // We should NOT place notes at columns 1, 2, 3, 5, 6, 7
    
    // With BASE_RESOLUTION=64, stepsPerBar=16, zoomLevel=16:
    // storagePerDisplay = 64/16 = 4
    // Quarter note = 64/4 = 16 storage steps (with gap: 15 storage steps)
    // Column 0: storageStart = 0, noteEnd = 15
    // Column 1-3: storageStart = 4,8,12, all overlap with column 0 note
    // Column 4: storageStart = 16, noteEnd = 31 (does not overlap)
    // Column 5-7: storageStart = 20,24,28, all overlap with column 4 note
    
    expect(noteChange).toHaveBeenCalledTimes(2); // Only columns 0 and 4
    
    const call0 = noteChange.mock.calls[0][0].detail;
    const call1 = noteChange.mock.calls[1][0].detail;
    
    expect(call0.start).toBe(0); // Column 0
    expect(call0.length).toBe(15); // Quarter note with articulation gap
    expect(call0.value).toBe(true);
    
    expect(call1.start).toBe(16); // Column 4
    expect(call1.length).toBe(15);
    expect(call1.value).toBe(true);
  });
  
  it('should place 16th notes at every column when dragging on 16-step grid', async () => {
    const rows = 4;
    const columns = 16;
    const stepsPerBar = 16;
    const storageColumns = columns * (BASE_RESOLUTION / stepsPerBar);
    
    const { component, container } = render(Grid, {
      props: {
        rows,
        columns,
        notes: createNotes(rows, storageColumns),
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        stepsPerBar,
        noteLengthDenominator: 16, // 16th notes
        zoomLevel: 16
      }
    });

    const noteChange = vi.fn();
    component.$on('notechange', noteChange);

    const canvas = container.querySelector('canvas');
    // In jsdom, scroller.clientWidth = 0, so:
    // availableWidth = 8 * 28 = 224, visibleColumns = 8, cellSize = 28
    const cellSize = 28;
    const canvasWidth = 8 * cellSize; // 224px
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: canvasWidth, height: rows * cellSize });
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();

    // Drag from column 0 to column 3 (using actual jsdom cell size)
    await fireEvent.pointerDown(canvas, { clientX: cellSize * 0.5, clientY: 10, pointerId: 1 });
    await fireEvent.pointerMove(canvas, { clientX: cellSize * 1.5, clientY: 10, pointerId: 1 });
    await fireEvent.pointerMove(canvas, { clientX: cellSize * 2.5, clientY: 10, pointerId: 1 });
    await fireEvent.pointerMove(canvas, { clientX: cellSize * 3.5, clientY: 10, pointerId: 1 });
    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    // A 16th note spans 1 logical column (16/16 = 1)
    // So when dragging across 4 columns, we should place 4 separate notes
    
    // With BASE_RESOLUTION=64, stepsPerBar=16, zoomLevel=16:
    // storagePerDisplay = 64/16 = 4
    // 16th note = 64/16 = 4 storage steps (with gap: 3 storage steps)
    // Column 0: storageStart = 0
    // Column 1: storageStart = 4
    // Column 2: storageStart = 8
    // Column 3: storageStart = 12
    
    expect(noteChange).toHaveBeenCalledTimes(4); // All 4 columns
    
    for (let i = 0; i < 4; i++) {
      const call = noteChange.mock.calls[i][0].detail;
      expect(call.start).toBe(i * 4); // Column i → storage i*4
      expect(call.length).toBe(3); // 16th note with articulation gap
      expect(call.value).toBe(true);
    }
  });
});
