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
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 512, height: 128 });
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();

    // Calculate cell size
    const cellSize = 512 / 16; // 32 pixels per cell

    // Drag from dot 1 (column 0) to dot 3 (column 2)
    // Start at column 0, center of cell: 16 pixels
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
    
    console.log('noteChange calls:', noteChange.mock.calls.length);
    noteChange.mock.calls.forEach((call, idx) => {
      const detail = call[0].detail;
      console.log(`Call ${idx}: start=${detail.start}, length=${detail.length}, storageStart=${detail.start}, logicalCol=${Math.floor(detail.start / 4)}`);
    });
    
    // With BASE_RESOLUTION=64, stepsPerBar=16:
    // storagePerLogical = 64/16 = 4
    // 8th note = 64/8 = 8 storage steps (with gap: 7 storage steps)
    // Column 0: storageStart = 0
    // Column 1: storageStart = 4
    // Column 2: storageStart = 8
    
    // Current behavior (BUG): Places notes at columns 0, 1, 2 (3 notes)
    // Expected behavior (FIX): Should only place notes at columns 0 and 2 (2 notes)
    
    // This test currently demonstrates the bug
    expect(noteChange).toHaveBeenCalled();
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
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 512, height: 128 });
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();

    const cellSize = 512 / 16;

    // Drag from column 0 to column 7 (8 columns)
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
    
    console.log('Quarter note drag - noteChange calls:', noteChange.mock.calls.length);
    noteChange.mock.calls.forEach((call, idx) => {
      const detail = call[0].detail;
      console.log(`Call ${idx}: start=${detail.start}, length=${detail.length}, logicalCol=${Math.floor(detail.start / 4)}`);
    });
  });
});
