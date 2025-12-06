import { describe, it, expect, beforeEach } from 'vitest';
import { project } from '../projectStore.js';
import { get } from 'svelte/store';

describe('cursor painting with undo', () => {
  beforeEach(() => {
    const snapshot = project.defaultSnapshot();
    project.load(snapshot);
  });

  it('should handle undo after painting with cursor (single range)', () => {
    // Simulate cursor painting - painting multiple cells in a row with note length > 1
    project.setNoteRange(0, 0, 0, 4, true);  // Paint 4 cells starting at position 0
    
    const afterPaint = get(project);
    expect(afterPaint.tracks[0].notes[0][0]).toBe(true);
    expect(afterPaint.tracks[0].notes[0][1]).toBe(true);
    expect(afterPaint.tracks[0].notes[0][2]).toBe(true);
    expect(afterPaint.tracks[0].notes[0][3]).toBe(true);
    
    // Undo the painting
    const undoResult = project.undo();
    expect(undoResult).toBe(true);
    
    const afterUndo = get(project);
    expect(afterUndo).toBeTruthy();
    expect(afterUndo.tracks).toBeTruthy();
    expect(afterUndo.tracks[0]).toBeTruthy();
    expect(afterUndo.tracks[0].notes).toBeTruthy();
    expect(afterUndo.tracks[0].notes[0]).toBeTruthy();
    expect(afterUndo.tracks[0].notes[0][0]).toBe(false);
    expect(afterUndo.tracks[0].notes[0][1]).toBe(false);
    expect(afterUndo.tracks[0].notes[0][2]).toBe(false);
    expect(afterUndo.tracks[0].notes[0][3]).toBe(false);
    
    // Try to interact with the app - this should work without breaking
    project.setNoteRange(0, 1, 0, 1, true);
    const afterNewPaint = get(project);
    expect(afterNewPaint.tracks[0].notes[1][0]).toBe(true);
  });

  it('should handle undo after painting with cursor drag (multiple ranges)', () => {
    // Simulate cursor drag that paints multiple overlapping or adjacent ranges
    // This is what happens when user drags cursor across cells
    project.setNoteRange(0, 0, 0, 2, true);  // Paint cells 0-1
    project.setNoteRange(0, 0, 1, 2, true);  // Paint cells 1-2 (overlaps with previous)
    project.setNoteRange(0, 0, 2, 2, true);  // Paint cells 2-3
    project.setNoteRange(0, 0, 3, 2, true);  // Paint cells 3-4
    
    const afterPaint = get(project);
    for (let i = 0; i < 5; i++) {
      expect(afterPaint.tracks[0].notes[0][i]).toBe(true);
    }
    
    // Undo all painting operations
    for (let i = 0; i < 4; i++) {
      const result = project.undo();
      expect(result).toBe(true);
      const state = get(project);
      expect(state).toBeTruthy();
      expect(state.tracks).toBeTruthy();
    }
    
    const afterAllUndos = get(project);
    for (let i = 0; i < 5; i++) {
      expect(afterAllUndos.tracks[0].notes[0][i]).toBe(false);
    }
    
    // App should still function after all undos
    project.setNoteRange(0, 1, 0, 1, true);
    const finalState = get(project);
    expect(finalState.tracks[0].notes[1][0]).toBe(true);
  });

  it('should handle undo after erasing with cursor', () => {
    // First paint some notes (logical indices 0-7)
    // With stepsPerBar=16 and BASE_RESOLUTION=128, storagePerLogical=8
    // So logical 0-7 maps to storage indices 0-31
    project.setNoteRange(0, 0, 0, 8, true);
    
    const afterPaint = get(project);
    // Check storage indices 0-31 (logical 0-7)
    for (let i = 0; i < 32; i++) {
      expect(afterPaint.tracks[0].notes[0][i]).toBe(true);
    }
    
    // Now erase some notes (simulating cursor drag to erase)
    // Erase logical cells 2-4, which maps to storage indices 8-19
    project.setNoteRange(0, 0, 2, 3, false);
    
    const afterErase = get(project);
    // Storage 0-15 (logical 0-1) should still be true (8 storage steps per logical step with BASE_RESOLUTION=128)
    for (let i = 0; i < 16; i++) {
      expect(afterErase.tracks[0].notes[0][i]).toBe(true);
    }
    // Storage 16-39 (logical 2-4) should be false (erased)
    for (let i = 16; i < 40; i++) {
      expect(afterErase.tracks[0].notes[0][i]).toBe(false);
    }
    // Storage 40-63 (logical 5-7) should still be true
    for (let i = 40; i < 64; i++) {
      expect(afterErase.tracks[0].notes[0][i]).toBe(true);
    }
    
    // Undo the erase
    project.undo();
    
    const afterUndo = get(project);
    expect(afterUndo).toBeTruthy();
    // After undo, storage 8-19 should be true again
    for (let i = 8; i < 20; i++) {
      expect(afterUndo.tracks[0].notes[0][i]).toBe(true);
    }
    
    // App should still function
    project.setNoteRange(0, 1, 0, 1, true);
    const finalState = get(project);
    // Logical index 0 row 1 maps to storage indices 0-3
    expect(finalState.tracks[0].notes[1][0]).toBe(true);
  });

  it('should maintain track integrity after undo', () => {
    // Add a second track for multi-track testing
    project.addTrack();
    
    const initialState = get(project);
    const initialTrackCount = initialState.tracks.length;
    
    // Paint notes on multiple tracks
    project.setNoteRange(0, 0, 0, 4, true);
    project.setNoteRange(1, 0, 0, 4, true);
    
    const afterPaint = get(project);
    expect(afterPaint.tracks.length).toBe(initialTrackCount);
    expect(afterPaint.tracks[0].notes[0][0]).toBe(true);
    expect(afterPaint.tracks[1].notes[0][0]).toBe(true);
    
    // Undo both operations
    project.undo();
    project.undo();
    
    const afterUndo = get(project);
    expect(afterUndo.tracks.length).toBe(initialTrackCount);
    expect(afterUndo.tracks[0]).toBeTruthy();
    expect(afterUndo.tracks[1]).toBeTruthy();
    expect(afterUndo.tracks[0].notes).toBeTruthy();
    expect(afterUndo.tracks[1].notes).toBeTruthy();
    expect(afterUndo.tracks[0].notes[0][0]).toBe(false);
    expect(afterUndo.tracks[1].notes[0][0]).toBe(false);
  });

  it('should handle rapid cursor painting and undo', () => {
    // Simulate very rapid cursor painting (many quick setNoteRange calls)
    for (let i = 0; i < 20; i++) {
      project.setNoteRange(0, i % 8, i % 16, 1, true);
    }
    
    const afterRapidPaint = get(project);
    expect(afterRapidPaint).toBeTruthy();
    expect(afterRapidPaint.tracks).toBeTruthy();
    
    // Rapidly undo
    for (let i = 0; i < 20; i++) {
      if (project.canUndo()) {
        const result = project.undo();
        expect(result).toBe(true);
        const state = get(project);
        expect(state).toBeTruthy();
        expect(state.tracks).toBeTruthy();
      }
    }
    
    const afterRapidUndo = get(project);
    expect(afterRapidUndo).toBeTruthy();
    expect(afterRapidUndo.tracks).toBeTruthy();
    
    // Should still be functional
    project.setNoteRange(0, 0, 0, 1, true);
    const finalState = get(project);
    expect(finalState.tracks[0].notes[0][0]).toBe(true);
  });
});
