import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Grid from '../components/Grid.svelte';
import { BASE_RESOLUTION } from '../store/projectStore.js';

const createNotes = (rows, cols) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));

describe('Zoom and Note Length Separation', () => {
  it('zoom level should control grid density independently of note length', async () => {
    const rows = 4;
    const columns = 16; // logical columns (bars * stepsPerBar)
    const stepsPerBar = 16;
    const storageColumns = columns * (BASE_RESOLUTION / stepsPerBar); // 64 storage steps
    
    // Test with zoom level 32 (1/32 grid) but note length 16 (1/16 duration)
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
        noteLengthDenominator: 16, // 1/16 note duration
        zoomLevel: 32 // 1/32 grid density
      }
    });

    const noteChange = vi.fn();
    component.$on('notechange', noteChange);

    const canvas = container.querySelector('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 512, height: 128 });
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();

    // Click to place a note
    await fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    expect(noteChange).toHaveBeenCalled();
    const event = noteChange.mock.calls[0][0];
    
    // Note duration should be based on noteLengthDenominator (16), not zoomLevel (32)
    // With BASE_RESOLUTION=64 and noteLengthDenominator=16:
    // noteStorageLength = 64/16 = 4
    // actual length = floor(4 * 0.75) = 3 (with 75% for gaps)
    expect(event.detail.length).toBe(3);
    expect(event.detail.value).toBe(true);
    expect(event.detail.storage).toBe(true);
  });

  it('changing zoom level should not affect note duration', async () => {
    const rows = 4;
    const columns = 16;
    const stepsPerBar = 16;
    const storageColumns = columns * (BASE_RESOLUTION / stepsPerBar);
    
    // Test 1: Zoom 16, Note length 32
    const { component: comp1, container: cont1 } = render(Grid, {
      props: {
        rows,
        columns,
        notes: createNotes(rows, storageColumns),
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        stepsPerBar,
        noteLengthDenominator: 32,
        zoomLevel: 16
      }
    });

    const noteChange1 = vi.fn();
    comp1.$on('notechange', noteChange1);

    const canvas1 = cont1.querySelector('canvas');
    canvas1.getBoundingClientRect = () => ({ left: 0, top: 0, width: 512, height: 128 });
    canvas1.setPointerCapture = vi.fn();
    canvas1.releasePointerCapture = vi.fn();

    await fireEvent.pointerDown(canvas1, { clientX: 10, clientY: 10, pointerId: 1 });
    await fireEvent.pointerUp(canvas1, { pointerId: 1 });

    const length1 = noteChange1.mock.calls[0][0].detail.length;

    // Test 2: Zoom 64, Note length 32 (same note length, different zoom)
    const { component: comp2, container: cont2 } = render(Grid, {
      props: {
        rows,
        columns,
        notes: createNotes(rows, storageColumns),
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        stepsPerBar,
        noteLengthDenominator: 32, // Same as test 1
        zoomLevel: 64 // Different from test 1
      }
    });

    const noteChange2 = vi.fn();
    comp2.$on('notechange', noteChange2);

    const canvas2 = cont2.querySelector('canvas');
    canvas2.getBoundingClientRect = () => ({ left: 0, top: 0, width: 512, height: 128 });
    canvas2.setPointerCapture = vi.fn();
    canvas2.releasePointerCapture = vi.fn();

    await fireEvent.pointerDown(canvas2, { clientX: 10, clientY: 10, pointerId: 1 });
    await fireEvent.pointerUp(canvas2, { pointerId: 1 });

    const length2 = noteChange2.mock.calls[0][0].detail.length;

    // Both should have same note length despite different zoom levels
    expect(length1).toBe(length2);
    // With BASE_RESOLUTION=64 and noteLengthDenominator=32:
    // noteStorageLength = 64/32 = 2
    // actual length = floor(2 * 0.75) = 1
    expect(length1).toBe(1);
  });

  it('note length should determine note duration independently of zoom', async () => {
    const rows = 4;
    const columns = 16;
    const stepsPerBar = 16;
    const storageColumns = columns * (BASE_RESOLUTION / stepsPerBar);
    const zoomLevel = 16; // Keep zoom constant
    
    // Test with note length 8 (longer notes)
    const { component: comp1, container: cont1 } = render(Grid, {
      props: {
        rows,
        columns,
        notes: createNotes(rows, storageColumns),
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        stepsPerBar,
        noteLengthDenominator: 8,
        zoomLevel
      }
    });

    const noteChange1 = vi.fn();
    comp1.$on('notechange', noteChange1);

    const canvas1 = cont1.querySelector('canvas');
    canvas1.getBoundingClientRect = () => ({ left: 0, top: 0, width: 512, height: 128 });
    canvas1.setPointerCapture = vi.fn();
    canvas1.releasePointerCapture = vi.fn();

    await fireEvent.pointerDown(canvas1, { clientX: 10, clientY: 10, pointerId: 1 });
    await fireEvent.pointerUp(canvas1, { pointerId: 1 });

    const length1 = noteChange1.mock.calls[0][0].detail.length;

    // Test with note length 64 (shorter notes)
    const { component: comp2, container: cont2 } = render(Grid, {
      props: {
        rows,
        columns,
        notes: createNotes(rows, storageColumns),
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        stepsPerBar,
        noteLengthDenominator: 64,
        zoomLevel
      }
    });

    const noteChange2 = vi.fn();
    comp2.$on('notechange', noteChange2);

    const canvas2 = cont2.querySelector('canvas');
    canvas2.getBoundingClientRect = () => ({ left: 0, top: 0, width: 512, height: 128 });
    canvas2.setPointerCapture = vi.fn();
    canvas2.releasePointerCapture = vi.fn();

    await fireEvent.pointerDown(canvas2, { clientX: 10, clientY: 10, pointerId: 1 });
    await fireEvent.pointerUp(canvas2, { pointerId: 1 });

    const length2 = noteChange2.mock.calls[0][0].detail.length;

    // Note length 8 should produce longer notes than note length 64
    expect(length1).toBeGreaterThan(length2);
    
    // With BASE_RESOLUTION=64:
    // noteLengthDenominator=8: noteStorageLength=64/8=8, actual=floor(8*0.75)=6
    // noteLengthDenominator=64: noteStorageLength=64/64=1, actual=floor(1*0.75)=0, but Math.max(1,...)=1
    expect(length1).toBe(6);
    expect(length2).toBe(1); // Minimum length is 1
  });

  it('zoom level should only affect grid density, not note duration', async () => {
    // This test verifies that changing zoom doesn't change the actual note length placed
    const rows = 4;
    const columns = 16;
    const stepsPerBar = 16;
    const storageColumns = columns * (BASE_RESOLUTION / stepsPerBar);
    const noteLengthDenominator = 16;
    
    const results = [];
    
    // Test with different zoom levels: 8, 16, 32, 64
    for (const zoom of [8, 16, 32, 64]) {
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
          noteLengthDenominator,
          zoomLevel: zoom
        }
      });

      const noteChange = vi.fn();
      component.$on('notechange', noteChange);

      const canvas = container.querySelector('canvas');
      canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 512, height: 128 });
      canvas.setPointerCapture = vi.fn();
      canvas.releasePointerCapture = vi.fn();

      await fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
      await fireEvent.pointerUp(canvas, { pointerId: 1 });

      results.push(noteChange.mock.calls[0][0].detail.length);
    }
    
    // All results should be the same (note length doesn't change with zoom)
    expect(results[0]).toBe(results[1]);
    expect(results[1]).toBe(results[2]);
    expect(results[2]).toBe(results[3]);
    // With BASE_RESOLUTION=64 and noteLengthDenominator=16:
    // noteStorageLength = 64/16 = 4
    // actual length = floor(4 * 0.75) = 3
    expect(results[0]).toBe(3);
  });
});
