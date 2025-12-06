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
    // A 64th note = 64/64 = 1 storage step
    // On a 64-step grid, each column = 1 storage step
    // We should be able to place 64th notes side by side
    
    const rows = 8;
    const columns = 16; // 16 logical columns
    const stepsPerBar = 16;
    const zoomLevel = 64; // 64-step grid for highest resolution
    const storageColumns = columns * (BASE_RESOLUTION / stepsPerBar); // 64 storage steps
    
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
    // Column 0, 1, 2, 3 should each get a 64th note
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

    // Expected: 4 notes should be placed
    // With BASE_RESOLUTION=64, stepsPerBar=16, zoomLevel=64:
    // storagePerDisplay = 64/64 = 1
    // For 64th notes (1 storage step), length remains 1
    // Column 0: storageStart = 0
    // Column 1: storageStart = 1
    // Column 2: storageStart = 2
    // Column 3: storageStart = 3
    
    console.log('Dispatched events:', dispatchedEvents);
    
    // All 4 notes should be placed side by side
    expect(dispatchedEvents.length).toBe(4);
    
    for (let i = 0; i < 4; i++) {
      const note = dispatchedEvents[i];
      expect(note.start).toBe(i); // Each at its own storage position
      expect(note.value).toBe(true);
      // For 64th notes (1 storage step), we can't reduce by 1
      // So length should be 1
      expect(note.length).toBe(1);
    }
  });

  it('should place separate 64th notes without combining them on consecutive clicks', async () => {
    // Test that separate click actions can place 64th notes side by side
    // (not dragging, but individual clicks)
    
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

    // Place first 64th note at column 0
    await fireEvent.pointerDown(canvas, {
      clientX: rect.left + cellSize * 0.5,
      clientY: rect.top + cellSize * 0.5,
      pointerId: 1
    });
    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    const firstNote = dispatchedEvents[0];
    expect(firstNote.start).toBe(0);
    expect(firstNote.value).toBe(true);
    expect(firstNote.length).toBe(1); // 64th note is 1 storage step

    dispatchedEvents = [];

    // Place second 64th note at column 1 (adjacent)
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
    expect(secondNote.start).toBe(1);
    expect(secondNote.value).toBe(true);
    expect(secondNote.length).toBe(1);
  });
});
