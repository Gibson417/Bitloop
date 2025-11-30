import { describe, it, expect, beforeEach } from 'vitest';
import { project } from '../projectStore.js';
import { get } from 'svelte/store';

describe('project store grid-specific undo/redo', () => {
  beforeEach(() => {
    // Reset to a clean state
    const snapshot = project.defaultSnapshot();
    project.load(snapshot);
  });

  it('grid undo/redo only affects note changes, not other settings', () => {
    const initialState = get(project);
    const initialBpm = initialState.bpm;
    const initialBars = initialState.bars;
    
    // Make a note change
    project.setNoteRange(0, 0, 0, 1, true);
    const afterNote = get(project);
    expect(afterNote.tracks[0].notes[0][0]).toBe(true);
    
    // Change BPM (non-grid change)
    project.setBpm(140);
    const afterBpm = get(project);
    expect(afterBpm.bpm).toBe(140);
    
    // Make another note change
    project.setNoteRange(0, 1, 0, 1, true);
    const afterSecondNote = get(project);
    expect(afterSecondNote.tracks[0].notes[1][0]).toBe(true);
    
    // Grid undo should only undo the last note change, not the BPM change
    expect(project.gridUndo()).toBe(true);
    const afterGridUndo = get(project);
    expect(afterGridUndo.tracks[0].notes[1][0]).toBe(false); // Last note change undone
    expect(afterGridUndo.tracks[0].notes[0][0]).toBe(true);  // First note change still there
    expect(afterGridUndo.bpm).toBe(140); // BPM change not affected by grid undo
    
    // Another grid undo should undo the first note change
    expect(project.gridUndo()).toBe(true);
    const afterSecondGridUndo = get(project);
    expect(afterSecondGridUndo.tracks[0].notes[0][0]).toBe(false); // First note change undone
    expect(afterSecondGridUndo.bpm).toBe(140); // BPM still 140
    
    // No more grid history to undo
    expect(project.gridUndo()).toBe(false);
    
    // Grid redo should restore note changes
    expect(project.gridRedo()).toBe(true);
    const afterGridRedo = get(project);
    expect(afterGridRedo.tracks[0].notes[0][0]).toBe(true);
    expect(afterGridRedo.bpm).toBe(140); // BPM still 140
  });

  it('grid undo/redo is independent of global undo/redo', () => {
    // Make a note change
    project.setNoteRange(0, 0, 0, 1, true);
    expect(get(project).tracks[0].notes[0][0]).toBe(true);
    
    // Change BPM
    project.setBpm(150);
    expect(get(project).bpm).toBe(150);
    
    // Make another note change
    project.setNoteRange(0, 1, 0, 1, true);
    expect(get(project).tracks[0].notes[1][0]).toBe(true);
    
    // Grid undo should only undo the last note change
    project.gridUndo();
    let state = get(project);
    expect(state.tracks[0].notes[1][0]).toBe(false);
    expect(state.tracks[0].notes[0][0]).toBe(true); // First note still there
    expect(state.bpm).toBe(150); // BPM unchanged by grid undo
    
    // Grid undo again should undo the first note
    project.gridUndo();
    state = get(project);
    expect(state.tracks[0].notes[0][0]).toBe(false); // First note undone
    expect(state.bpm).toBe(150); // BPM still unchanged
    
    // No more grid history
    expect(project.gridUndo()).toBe(false);
    
    // Grid redo should restore notes
    project.gridRedo();
    state = get(project);
    expect(state.tracks[0].notes[0][0]).toBe(true);
    expect(state.bpm).toBe(150); // BPM still 150
  });

  it('non-grid changes do not affect grid undo/redo history', () => {
    // Add a second track for testing selectTrack
    project.addTrack();
    
    // Make a note change
    project.setNoteRange(0, 0, 0, 1, true);
    
    // Make several non-grid changes
    project.setBpm(130);
    project.setBars(4);
    project.setStepsPerBar(32);
    project.selectTrack(1);
    
    // Grid undo should still undo the note change
    expect(project.gridUndo()).toBe(true);
    const state = get(project);
    expect(state.tracks[0].notes[0][0]).toBe(false);
    // All non-grid settings should remain
    expect(state.bpm).toBe(130);
    expect(state.bars).toBe(4);
    expect(state.stepsPerBar).toBe(32);
    expect(state.selectedTrack).toBe(1);
  });

  it('grid undo/redo handles multiple note changes correctly', () => {
    // Make multiple note changes
    for (let row = 0; row < 5; row++) {
      project.setNoteRange(0, row, row * 2, 1, true);
    }
    
    // Verify all notes are set
    let state = get(project);
    for (let row = 0; row < 5; row++) {
      const storageIndex = row * 2 * 4; // Convert logical to storage index
      expect(state.tracks[0].notes[row][storageIndex]).toBe(true);
    }
    
    // Undo all note changes
    for (let i = 0; i < 5; i++) {
      expect(project.gridUndo()).toBe(true);
    }
    
    // Verify all notes are cleared
    state = get(project);
    for (let row = 0; row < 5; row++) {
      const storageIndex = row * 2 * 4;
      expect(state.tracks[0].notes[row][storageIndex]).toBe(false);
    }
    
    // No more to undo
    expect(project.gridUndo()).toBe(false);
    
    // Redo all changes
    for (let i = 0; i < 5; i++) {
      expect(project.gridRedo()).toBe(true);
    }
    
    // Verify all notes are restored
    state = get(project);
    for (let row = 0; row < 5; row++) {
      const storageIndex = row * 2 * 4;
      expect(state.tracks[0].notes[row][storageIndex]).toBe(true);
    }
  });

  it('grid history is cleared when loading a new project', () => {
    // Make some note changes
    project.setNoteRange(0, 0, 0, 1, true);
    project.setNoteRange(0, 1, 0, 1, true);
    
    // Verify we can undo
    expect(project.gridUndo()).toBe(true);
    
    // Load a new project
    const newSnapshot = project.defaultSnapshot();
    project.load(newSnapshot);
    
    // Grid history should be cleared
    expect(project.gridUndo()).toBe(false);
    expect(project.gridRedo()).toBe(false);
  });

  it('grid undo preserves track settings while undoing notes', () => {
    // Set some track settings
    project.setTrackSetting(0, 'volume', 0.5);
    project.setTrackSetting(0, 'octave', 5);
    project.setTrackSetting(0, 'waveform', 'sine');
    
    // Make a note change
    project.setNoteRange(0, 0, 0, 1, true);
    
    // Verify track settings and note
    let state = get(project);
    expect(state.tracks[0].volume).toBe(0.5);
    expect(state.tracks[0].octave).toBe(5);
    expect(state.tracks[0].waveform).toBe('sine');
    expect(state.tracks[0].notes[0][0]).toBe(true);
    
    // Grid undo should only undo the note, not track settings
    project.gridUndo();
    state = get(project);
    expect(state.tracks[0].notes[0][0]).toBe(false);
    expect(state.tracks[0].volume).toBe(0.5);
    expect(state.tracks[0].octave).toBe(5);
    expect(state.tracks[0].waveform).toBe('sine');
  });
});
