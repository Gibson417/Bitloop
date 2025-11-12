import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Grid from '../components/Grid.svelte';

const createNotes = (rows, cols) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));

describe('Grid component', () => {
  it('dispatches notechange on pointer interactions', async () => {
    const rows = 4;
    const columns = 8;
    const { component, container } = render(Grid, {
      props: {
        rows,
        columns,
        notes: createNotes(rows, columns),
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        noteLengthDenominator: 1
      }
    });

    const noteChange = vi.fn();
    component.$on('notechange', noteChange);

    const canvas = container.querySelector('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 320, height: 160 });
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();

    await fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
    await fireEvent.pointerMove(canvas, { clientX: 70, clientY: 10, pointerId: 1 });
    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    expect(noteChange).toHaveBeenCalled();
    const event = noteChange.mock.calls[0][0];
  expect(event.detail).toHaveProperty('row');
  expect(event.detail).toHaveProperty('start');
  expect(event.detail).toHaveProperty('length');
  expect(event.detail).toHaveProperty('value');
  // Grid now includes a storage flag when start/length are high-resolution indices
  expect(event.detail).toHaveProperty('storage');
  expect(event.detail.storage).toBe(true);
  expect(event.detail.length).toBeGreaterThan(0);
  });

  it('clicking an empty cell should add a note (value=true)', async () => {
    const rows = 4;
    const columns = 8;
    const { component, container } = render(Grid, {
      props: {
        rows,
        columns,
        notes: createNotes(rows, columns),
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        noteLengthDenominator: 16,
        stepsPerBar: 16
      }
    });

    const noteChange = vi.fn();
    component.$on('notechange', noteChange);

    const canvas = container.querySelector('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 512, height: 128 });
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();

    // Click on an empty cell
    await fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    expect(noteChange).toHaveBeenCalled();
    const event = noteChange.mock.calls[0][0];
    expect(event.detail.value).toBe(true); // Should add note
  });

  it('clicking a filled cell should remove the note (value=false)', async () => {
    const rows = 4;
    const columns = 16;
    const notes = createNotes(rows, columns * 4); // Storage resolution
    // Fill first cell at storage indices 0-3 (corresponds to first display column)
    notes[0][0] = true;
    notes[0][1] = true;
    notes[0][2] = true;
    notes[0][3] = true;

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
        stepsPerBar: 16
      }
    });

    const noteChange = vi.fn();
    component.$on('notechange', noteChange);

    const canvas = container.querySelector('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 512, height: 128 });
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();

    // Click on the filled cell
    await fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    expect(noteChange).toHaveBeenCalled();
    const event = noteChange.mock.calls[0][0];
    expect(event.detail.value).toBe(false); // Should remove note
  });

  it('holding shift key should enable erase mode', async () => {
    const rows = 4;
    const columns = 8;
    const { component, container } = render(Grid, {
      props: {
        rows,
        columns,
        notes: createNotes(rows, columns),
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        noteLengthDenominator: 16,
        stepsPerBar: 16
      }
    });

    const noteChange = vi.fn();
    component.$on('notechange', noteChange);

    const canvas = container.querySelector('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 512, height: 128 });
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();

    // Click on an empty cell WITH shift key - should erase (value=false)
    await fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1, shiftKey: true });
    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    expect(noteChange).toHaveBeenCalled();
    const event = noteChange.mock.calls[0][0];
    expect(event.detail.value).toBe(false); // Should erase even on empty cell
  });

  it('holding alt key should enable erase mode', async () => {
    const rows = 4;
    const columns = 8;
    const { component, container } = render(Grid, {
      props: {
        rows,
        columns,
        notes: createNotes(rows, columns),
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        noteLengthDenominator: 16,
        stepsPerBar: 16
      }
    });

    const noteChange = vi.fn();
    component.$on('notechange', noteChange);

    const canvas = container.querySelector('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 512, height: 128 });
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();

    // Click on an empty cell WITH alt key - should erase (value=false)
    await fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1, altKey: true });
    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    expect(noteChange).toHaveBeenCalled();
    const event = noteChange.mock.calls[0][0];
    expect(event.detail.value).toBe(false); // Should erase even on empty cell
  });
});
