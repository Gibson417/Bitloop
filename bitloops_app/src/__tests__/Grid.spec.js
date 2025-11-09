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
        isPlaying: false
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
    expect(event.detail).toHaveProperty('step');
    expect(event.detail).toHaveProperty('value');
  });
});
