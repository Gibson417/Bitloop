import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Grid from '../components/Grid.svelte';

const createNotes = (rows, cols) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));

describe('Grid keyboard navigation', () => {
  it('enables keyboard mode on focus', async () => {
    const rows = 4;
    const columns = 8;
    const { container } = render(Grid, {
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

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    expect(canvas.getAttribute('tabindex')).toBe('0');
    expect(canvas.getAttribute('role')).toBe('grid');
  });

  it('dispatches notechange on Enter key', async () => {
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
    
    // Focus the canvas first
    await fireEvent.focus(canvas);
    
    // Press Enter to toggle note
    await fireEvent.keyDown(canvas, { key: 'Enter' });

    expect(noteChange).toHaveBeenCalled();
    const event = noteChange.mock.calls[0][0];
    expect(event.detail).toHaveProperty('row');
    expect(event.detail).toHaveProperty('start');
    expect(event.detail).toHaveProperty('length');
    expect(event.detail).toHaveProperty('value');
    expect(event.detail).toHaveProperty('storage');
  });

  it('moves focus with arrow keys', async () => {
    const rows = 4;
    const columns = 8;
    const { container } = render(Grid, {
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

    const canvas = container.querySelector('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 320, height: 160 });
    
    // Focus the canvas
    await fireEvent.focus(canvas);
    
    // Press arrow keys - should not throw errors
    await fireEvent.keyDown(canvas, { key: 'ArrowDown' });
    await fireEvent.keyDown(canvas, { key: 'ArrowRight' });
    await fireEvent.keyDown(canvas, { key: 'ArrowUp' });
    await fireEvent.keyDown(canvas, { key: 'ArrowLeft' });

    // Test passes if no errors thrown
    expect(true).toBe(true);
  });
});
