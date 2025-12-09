import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Grid from '../components/Grid.svelte';

const createNotes = (rows, cols) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));

// BASE_RESOLUTION is 128 steps per bar
const BASE_RESOLUTION = 128;

describe('Grid component - Cut Tool', () => {
  it('should split a long note into two shorter notes when clicked with cut tool', async () => {
    const rows = 4;
    const columns = 16;
    const stepsPerBar = 16;
    // Storage resolution: columns * (BASE_RESOLUTION / stepsPerBar) = 16 * 8 = 128
    const notes = createNotes(rows, columns * (BASE_RESOLUTION / stepsPerBar));
    
    // Create a long note spanning 16 storage steps (row 0, storage indices 16-31)
    // At zoomLevel 16, stepsPerBar 16: each display column = BASE_RESOLUTION/16 = 8 storage steps
    // So this note spans display columns 2-4 (16/8=2, 32/8=4)
    for (let i = 16; i < 32; i++) {
      notes[0][i] = true;
    }

    const { component, container } = render(Grid, {
      props: {
        rows,
        columns,
        notes,
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        noteLengthDenominator: 16,
        stepsPerBar,
        zoomLevel: 16,
        activeTool: 'cut'
      }
    });

    const noteChange = vi.fn();
    component.$on('notechange', noteChange);

    const canvas = container.querySelector('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 512, height: 128 });
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();

    // Click in the middle of the long note
    // Display column 3 is at storage index 24 (3 * 8 = 24), which is in the middle of the note (16-31)
    // At 512px width / 16 columns = 32px per column
    // Display column 3 * 32px = 96px
    await fireEvent.pointerDown(canvas, { clientX: 96, clientY: 10, pointerId: 1 });
    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    // Should dispatch 3 notechange events:
    // 1. Clear the original note (value: false, length: 16)
    // 2. Add first part (value: true, before the cut, length: 8)
    // 3. Add second part (value: true, after the cut with gap, length: 7)
    expect(noteChange).toHaveBeenCalledTimes(3);

    const calls = noteChange.mock.calls;
    
    // First call: clear original note
    expect(calls[0][0].detail.row).toBe(0);
    expect(calls[0][0].detail.value).toBe(false);
    expect(calls[0][0].detail.storage).toBe(true);
    
    // Second call: add first part
    expect(calls[1][0].detail.row).toBe(0);
    expect(calls[1][0].detail.value).toBe(true);
    expect(calls[1][0].detail.storage).toBe(true);
    
    // Third call: add second part (with gap)
    expect(calls[2][0].detail.row).toBe(0);
    expect(calls[2][0].detail.value).toBe(true);
    expect(calls[2][0].detail.storage).toBe(true);
  });

  it('should not cut notes that are too short (less than 2 steps)', async () => {
    const rows = 4;
    const columns = 16;
    const stepsPerBar = 16;
    const notes = createNotes(rows, columns * (BASE_RESOLUTION / stepsPerBar));
    
    // Create a 1-step note at storage index 16
    notes[0][16] = true;

    const { component, container } = render(Grid, {
      props: {
        rows,
        columns,
        notes,
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        noteLengthDenominator: 16,
        stepsPerBar,
        zoomLevel: 16,
        activeTool: 'cut'
      }
    });

    const noteChange = vi.fn();
    component.$on('notechange', noteChange);

    const canvas = container.querySelector('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 512, height: 128 });
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();

    // Click on the short note (display column 2, storage index 16)
    await fireEvent.pointerDown(canvas, { clientX: 64, clientY: 10, pointerId: 1 });
    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    // Should not dispatch any events (note is too short)
    expect(noteChange).not.toHaveBeenCalled();
  });

  it('should not cut when clicking on an empty cell', async () => {
    const rows = 4;
    const columns = 16;
    const stepsPerBar = 16;
    const notes = createNotes(rows, columns * (BASE_RESOLUTION / stepsPerBar));

    const { component, container } = render(Grid, {
      props: {
        rows,
        columns,
        notes,
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        noteLengthDenominator: 16,
        stepsPerBar,
        zoomLevel: 16,
        activeTool: 'cut'
      }
    });

    const noteChange = vi.fn();
    component.$on('notechange', noteChange);

    const canvas = container.querySelector('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 512, height: 128 });
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();

    // Click on an empty cell
    await fireEvent.pointerDown(canvas, { clientX: 96, clientY: 10, pointerId: 1 });
    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    // Should not dispatch any events
    expect(noteChange).not.toHaveBeenCalled();
  });

  it('should work in draw mode by default (not cut mode)', async () => {
    const rows = 4;
    const columns = 16;
    const stepsPerBar = 16;
    const notes = createNotes(rows, columns * (BASE_RESOLUTION / stepsPerBar));

    const { component, container } = render(Grid, {
      props: {
        rows,
        columns,
        notes,
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        noteLengthDenominator: 16,
        stepsPerBar,
        zoomLevel: 16,
        activeTool: 'draw' // Default draw mode
      }
    });

    const noteChange = vi.fn();
    component.$on('notechange', noteChange);

    const canvas = container.querySelector('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 512, height: 128 });
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();

    // Click on an empty cell in draw mode
    await fireEvent.pointerDown(canvas, { clientX: 96, clientY: 10, pointerId: 1 });
    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    // Should dispatch notechange to add a note (draw mode behavior)
    expect(noteChange).toHaveBeenCalled();
    expect(noteChange.mock.calls[0][0].detail.value).toBe(true);
  });

  it('should not cut at the exact start of a note', async () => {
    const rows = 4;
    const columns = 16;
    const stepsPerBar = 16;
    const notes = createNotes(rows, columns * (BASE_RESOLUTION / stepsPerBar));
    
    // Create a long note spanning 16 storage steps (row 0, storage indices 16-31)
    for (let i = 16; i < 32; i++) {
      notes[0][i] = true;
    }

    const { component, container } = render(Grid, {
      props: {
        rows,
        columns,
        notes,
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        noteLengthDenominator: 16,
        stepsPerBar,
        zoomLevel: 16,
        activeTool: 'cut'
      }
    });

    const noteChange = vi.fn();
    component.$on('notechange', noteChange);

    const canvas = container.querySelector('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 512, height: 128 });
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();

    // Click at the start of the note (display column 2, storage index 16)
    // 32px * 2 = 64px
    await fireEvent.pointerDown(canvas, { clientX: 64, clientY: 10, pointerId: 1 });
    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    // Should not cut at the exact start
    expect(noteChange).not.toHaveBeenCalled();
  });
});
