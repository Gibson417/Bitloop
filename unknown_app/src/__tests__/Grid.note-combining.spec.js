/**
 * Test for note combining issue
 * When placing individual notes on adjacent grid positions, they should NOT merge
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Grid from '../components/Grid.svelte';

describe('Grid - Note Combining Prevention', () => {
  let dispatchedEvents;

  beforeEach(() => {
    dispatchedEvents = [];
  });

  it('should place separate 8th notes without combining them', async () => {
    // Setup: 16-step grid, 8th note duration
    // An 8th note = 64/8 = 8 storage steps
    // On a 16-step grid, each column = 4 storage steps
    // First note at column 0 = storage 0-7 (but with gap should be 0-6)
    // Second note at column 2 = storage 8-15 (but with gap should be 8-14)
    
    const notes = Array.from({ length: 8 }, () => Array(64).fill(false));
    
    const { component, container } = render(Grid, {
      props: {
        notes,
        rows: 8,
        columns: 16,
        stepsPerBar: 16,
        noteLengthDenominator: 8, // 8th notes
        zoomLevel: 16,
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
    const rect = { left: 0, top: 0, width: 8 * cellSize, height: 8 * cellSize };
    canvas.getBoundingClientRect = () => rect;

    // Place first 8th note at column 0
    await fireEvent.pointerDown(canvas, {
      clientX: rect.left + cellSize * 0.5,
      clientY: rect.top + cellSize * 0.5,
      pointerId: 1
    });
    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    expect(dispatchedEvents.length).toBeGreaterThan(0);
    const firstNote = dispatchedEvents[0];
    expect(firstNote.start).toBe(0);
    expect(firstNote.value).toBe(true);
    // The key: length should be LESS than 8 to create a gap
    expect(firstNote.length).toBeLessThan(16);
    expect(firstNote.length).toBeGreaterThanOrEqual(15); // At least 7 to maintain visual appearance

    dispatchedEvents = [];

    // Place second 8th note at column 2 (storage position 8)
    await fireEvent.pointerDown(canvas, {
      clientX: rect.left + cellSize * 2.5,
      clientY: rect.top + cellSize * 0.5,
      pointerId: 2
    });
    await fireEvent.pointerUp(canvas, { pointerId: 2 });

    expect(dispatchedEvents.length).toBeGreaterThan(0);
    const secondNote = dispatchedEvents[0];
    expect(secondNote.start).toBe(16); // Starts at column 2 (doubled with BASE_RESOLUTION=128)
    expect(secondNote.value).toBe(true);
    // Same gap requirement (128/8 = 16, -1 = 15)
    expect(secondNote.length).toBeLessThan(16);
    expect(secondNote.length).toBeGreaterThanOrEqual(15);

    // Critical: There should be a gap between notes
    // First note ends at: 0 + firstNote.length (should be 15 or less)
    // Second note starts at: 16
    // Gap should be at least 1 storage step
    const firstNoteEnd = firstNote.start + firstNote.length;
    expect(secondNote.start).toBeGreaterThan(firstNoteEnd);
  });

  it('should place separate 16th notes on adjacent columns without combining', async () => {
    // Setup: 16-step grid, 16th note duration
    // A 16th note = 64/16 = 4 storage steps
    // First note at column 0 = storage 0-3 (with gap: 0-2)
    // Second note at column 1 = storage 4-7 (with gap: 4-6)
    
    const notes = Array.from({ length: 8 }, () => Array(64).fill(false));
    
    const { component, container } = render(Grid, {
      props: {
        notes,
        rows: 8,
        columns: 16,
        stepsPerBar: 16,
        noteLengthDenominator: 16, // 16th notes
        zoomLevel: 16,
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

    // In jsdom, scroller.clientWidth = 0, so:
    // availableWidth = 8 * 28 = 224, visibleColumns = 8, cellSize = 28
    const cellSize = 28;
    const rect = { left: 0, top: 0, width: 8 * cellSize, height: 8 * cellSize };
    canvas.getBoundingClientRect = () => rect;

    // Place first 16th note at column 0
    await fireEvent.pointerDown(canvas, {
      clientX: rect.left + cellSize * 0.5,
      clientY: rect.top + cellSize * 0.5,
      pointerId: 1
    });
    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    const firstNote = dispatchedEvents[0];
    expect(firstNote.start).toBe(0);
    expect(firstNote.value).toBe(true);
    expect(firstNote.length).toBeLessThan(8); // Should have gap
    expect(firstNote.length).toBeGreaterThanOrEqual(7);

    dispatchedEvents = [];

    // Place second 16th note at column 1 (adjacent)
    await fireEvent.pointerDown(canvas, {
      clientX: rect.left + cellSize * 1.5,
      clientY: rect.top + cellSize * 0.5,
      pointerId: 2
    });
    await fireEvent.pointerUp(canvas, { pointerId: 2 });

    const secondNote = dispatchedEvents[0];
    expect(secondNote.start).toBe(8); // Doubled with BASE_RESOLUTION=128
    expect(secondNote.value).toBe(true);
    expect(secondNote.length).toBeLessThan(8);
    expect(secondNote.length).toBeGreaterThanOrEqual(7);

    // Verify gap exists
    const firstNoteEnd = firstNote.start + firstNote.length;
    expect(secondNote.start).toBeGreaterThan(firstNoteEnd);
  });

  it('should create continuous notes in extend mode (Ctrl/Cmd held)', async () => {
    // In extend mode, notes SHOULD be continuous (no gap)
    const notes = Array.from({ length: 8 }, () => Array(64).fill(false));
    
    const { component, container } = render(Grid, {
      props: {
        notes,
        rows: 8,
        columns: 16,
        stepsPerBar: 16,
        noteLengthDenominator: 8,
        zoomLevel: 16,
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

    // In jsdom, scroller.clientWidth = 0, so:
    // availableWidth = 8 * 28 = 224, visibleColumns = 8, cellSize = 28
    const cellSize = 28;
    const rect = { left: 0, top: 0, width: 8 * cellSize, height: 8 * cellSize };
    canvas.getBoundingClientRect = () => rect;

    // Place note with Ctrl key held (extend mode)
    await fireEvent.pointerDown(canvas, {
      clientX: rect.left + cellSize * 0.5,
      clientY: rect.top + cellSize * 0.5,
      pointerId: 1,
      ctrlKey: true // Extend mode
    });

    // Drag to next column
    await fireEvent.pointerMove(canvas, {
      clientX: rect.left + cellSize * 1.5,
      clientY: rect.top + cellSize * 0.5,
      pointerId: 1,
      ctrlKey: true
    });

    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    // In extend mode, notes should use full cell width (no gap)
    // This allows creating long continuous notes
    const notes1 = dispatchedEvents.filter(e => e.value === true);
    expect(notes1.length).toBeGreaterThan(0);
    
    // At least one note should have full storage length (4 steps per column)
    const hasFullLength = notes1.some(note => note.length >= 4);
    expect(hasFullLength).toBe(true);
  });

  it('should toggle/erase notes properly without extending unintentionally', async () => {
    // When clicking on an existing note, it should toggle OFF, not extend
    const notes = Array.from({ length: 8 }, () => Array(64).fill(false));
    // Pre-populate with a note
    notes[0][0] = true;
    notes[0][1] = true;
    notes[0][2] = true;
    
    const { component, container } = render(Grid, {
      props: {
        notes,
        rows: 8,
        columns: 16,
        stepsPerBar: 16,
        noteLengthDenominator: 16,
        zoomLevel: 16,
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

    // In jsdom, scroller.clientWidth = 0, so:
    // availableWidth = 8 * 28 = 224, visibleColumns = 8, cellSize = 28
    const cellSize = 28;
    const rect = { left: 0, top: 0, width: 8 * cellSize, height: 8 * cellSize };
    canvas.getBoundingClientRect = () => rect;

    // Click on the cell with existing note
    await fireEvent.pointerDown(canvas, {
      clientX: rect.left + cellSize * 0.5,
      clientY: rect.top + cellSize * 0.5,
      pointerId: 1
    });
    await fireEvent.pointerUp(canvas, { pointerId: 1 });

    expect(dispatchedEvents.length).toBeGreaterThan(0);
    const toggleNote = dispatchedEvents[0];
    expect(toggleNote.start).toBe(0);
    expect(toggleNote.value).toBe(false); // Should toggle OFF
  });
});
