/**
 * Test for 64th note placement issue
 * When dragging to place 64th notes, they should be placeable side by side in the same row
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Grid from '../components/Grid.svelte';
import { BASE_RESOLUTION } from '../store/projectStore.js';

describe('Grid - 64th Note Placement', () => {
  let dispatchedEvents;

  beforeEach(() => {
    dispatchedEvents = [];
  });

  it('should place multiple 64th notes side by side when dragging on 64-step grid', async () => {
    // Setup: 64-step grid (zoom level 64), 64th note duration
    // With BASE_RESOLUTION=128, a 64th note = 128/64 = 2 storage steps
    // After articulation gap reduction: 2 - 1 = 1 storage step
    // This leaves a 1-step gap between notes, preventing them from combining
    
    const rows = 8;
    const columns = 16; // 16 logical columns
    const stepsPerBar = 16;
    const zoomLevel = 64; // 64-step grid for highest resolution
    const storageColumns = columns * (BASE_RESOLUTION / stepsPerBar); // 128 storage steps
    
    const notes = Array.from({ length: rows }, () => Array(storageColumns).fill(false));
    
    const { component, container } = render(Grid, {
      props: {
        notes,
        rows,
        columns,
        stepsPerBar,
        noteLengthDenominator: 64, // 64th notes
        zoomLevel,
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false
      }
    });

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();

    // Mock pointer capture methods (not available in jsdom)
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();

    // Listen to notechange events
    component.$on('notechange', (event) => {
      dispatchedEvents.push(event.detail);
    });

    // In jsdom, scroller.clientWidth = 0, so:
    // availableWidth = 8 * 28 = 224, visibleColumns = 8, cellSize = 28
    const cellSize = 28;
    const rect = { left: 0, top: 0, width: 8 * cellSize, height: rows * cellSize };
    canvas.getBoundingClientRect = () => rect;

    // Drag across 4 columns to place 4 adjacent 64th notes
    // With BASE_RESOLUTION=128, each display column maps to 2 storage steps
    // Column 0 → storage 0, Column 1 → storage 2, Column 2 → storage 4, Column 3 → storage 6
    await fireEvent.pointerDown(canvas, {
      clientX: rect.left + cellSize * 0.5,
      clientY: rect.top + cellSize * 0.5,
      pointerId: 1
    });

    await fireEvent.pointerMove(canvas, {
      clientX: rect.left + cellSize * 1.5,
      clientY: rect.top + cellSize * 0.5,
      pointerId: 1
    });

    await fireEvent.pointerMove(canvas, {
      clientX: rect.left + cellSize * 2.5,
      clientY: rect.top + cellSize * 0.5,
      pointerId: 1
    });

    await fireEvent.pointerMove(canvas, {
      clientX: rect.left + cellSize * 3.5,
      clientY: rect.top + cellSize * 0.5,
      pointerId: 1
    });

    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    // Expected: 4 notes should be placed with gaps
    // With BASE_RESOLUTION=128, stepsPerBar=16, zoomLevel=64:
    // storagePerDisplay = 128/64 = 2
    // 64th notes: 128/64 = 2 storage steps, reduced by 1 = 1 step
    // Column 0: storageStart = 0, length = 1 (gap at position 1)
    // Column 1: storageStart = 2, length = 1 (gap at position 3)
    // Column 2: storageStart = 4, length = 1 (gap at position 5)
    // Column 3: storageStart = 6, length = 1 (gap at position 7)
    
    console.log('Dispatched events:', dispatchedEvents);
    
    // All 4 notes should be placed side by side with gaps
    expect(dispatchedEvents.length).toBe(4);
    
    for (let i = 0; i < 4; i++) {
      const note = dispatchedEvents[i];
      expect(note.start).toBe(i * 2); // Notes at even positions (0, 2, 4, 6)
      expect(note.value).toBe(true);
      // With BASE_RESOLUTION=128, 64th notes are 2 steps, reduced by 1 for articulation = 1 step
      expect(note.length).toBe(1);
    }
  });

  it('should place separate 64th notes without combining them on consecutive clicks', async () => {
    // Test that separate click actions can place 64th notes side by side
    // (not dragging, but individual clicks)
    // With BASE_RESOLUTION=128, 64th notes have proper gaps built in
    
    const rows = 8;
    const columns = 16;
    const stepsPerBar = 16;
    const zoomLevel = 64;
    const storageColumns = columns * (BASE_RESOLUTION / stepsPerBar);
    
    const notes = Array.from({ length: rows }, () => Array(storageColumns).fill(false));
    
    const { component, container } = render(Grid, {
      props: {
        notes,
        rows,
        columns,
        stepsPerBar,
        noteLengthDenominator: 64, // 64th notes
        zoomLevel,
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false
      }
    });

    const canvas = container.querySelector('canvas');
    
    // Mock pointer capture methods (not available in jsdom)
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();
    
    component.$on('notechange', (event) => {
      dispatchedEvents.push(event.detail);
    });

    const cellSize = 28;
    const rect = { left: 0, top: 0, width: 8 * cellSize, height: rows * cellSize };
    canvas.getBoundingClientRect = () => rect;

    // Place first 64th note at column 0 (storage position 0)
    await fireEvent.pointerDown(canvas, {
      clientX: rect.left + cellSize * 0.5,
      clientY: rect.top + cellSize * 0.5,
      pointerId: 1
    });
    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    const firstNote = dispatchedEvents[0];
    expect(firstNote.start).toBe(0);
    expect(firstNote.value).toBe(true);
    expect(firstNote.length).toBe(1); // With BASE_RESOLUTION=128: 128/64 = 2, reduced by 1 = 1

    dispatchedEvents = [];

    // Place second 64th note at column 1 (storage position 2 with BASE_RESOLUTION=128)
    await fireEvent.pointerDown(canvas, {
      clientX: rect.left + cellSize * 1.5,
      clientY: rect.top + cellSize * 0.5,
      pointerId: 2
    });
    await fireEvent.pointerUp(canvas, { pointerId: 2 });

    // This should work because each click is a separate gesture
    // paintedRanges is cleared on each pointerDown
    expect(dispatchedEvents.length).toBe(1);
    const secondNote = dispatchedEvents[0];
    expect(secondNote.start).toBe(2); // Column 1 maps to storage position 2
    expect(secondNote.value).toBe(true);
    expect(secondNote.length).toBe(1);
  });
});
