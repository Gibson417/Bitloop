import { describe, it, expect, beforeEach } from 'vitest';
import { project } from '../projectStore.js';
import { get } from 'svelte/store';

describe('project store undo/redo', () => {
  beforeEach(() => {
    // Reset to a clean state
    const snapshot = project.defaultSnapshot();
    project.load(snapshot);
  });

  it('handles multiple undo operations without breaking', () => {
    const initialState = get(project);
    
    // Make several changes to create history
    project.setNoteRange(0, 0, 0, 1, true);
    const afterFirst = get(project);
    expect(afterFirst.tracks[0].notes[0][0]).toBe(true);
    
    project.setNoteRange(0, 1, 0, 1, true);
    const afterSecond = get(project);
    expect(afterSecond.tracks[0].notes[1][0]).toBe(true);
    
    project.setNoteRange(0, 2, 0, 1, true);
    const afterThird = get(project);
    expect(afterThird.tracks[0].notes[2][0]).toBe(true);

    // Now undo multiple times
    expect(project.canUndo()).toBe(true);
    project.undo();
    const afterFirstUndo = get(project);
    expect(afterFirstUndo.tracks[0].notes[2][0]).toBe(false);
    
    expect(project.canUndo()).toBe(true);
    project.undo();
    const afterSecondUndo = get(project);
    expect(afterSecondUndo.tracks[0].notes[1][0]).toBe(false);
    
    expect(project.canUndo()).toBe(true);
    project.undo();
    const afterThirdUndo = get(project);
    expect(afterThirdUndo.tracks[0].notes[0][0]).toBe(false);
    
    // After undoing all changes, canUndo should return false
    expect(project.canUndo()).toBe(false);
    
    // Attempting to undo when there's no history should not crash
    const result = project.undo();
    expect(result).toBe(false);
    
    // State should remain stable
    const finalState = get(project);
    expect(finalState).toBeTruthy();
    expect(finalState.tracks).toBeTruthy();
    expect(finalState.tracks.length).toBeGreaterThan(0);
  });

  it('handles rapid undo operations', () => {
    // Make 10 changes
    for (let i = 0; i < 10; i++) {
      project.setNoteRange(0, i % 8, i, 1, true);
    }
    
    // Rapidly undo all of them
    for (let i = 0; i < 10; i++) {
      if (project.canUndo()) {
        project.undo();
      }
    }
    
    // Verify we can still interact with the store
    const state = get(project);
    expect(state).toBeTruthy();
    expect(state.tracks).toBeTruthy();
    
    // Verify we can still make changes
    project.setNoteRange(0, 0, 0, 1, true);
    const afterNewChange = get(project);
    expect(afterNewChange.tracks[0].notes[0][0]).toBe(true);
  });

  it('handles undo beyond history limit', () => {
    // Attempt to undo more times than there is history
    const result1 = project.undo();
    expect(result1).toBe(false);
    
    const result2 = project.undo();
    expect(result2).toBe(false);
    
    const result3 = project.undo();
    expect(result3).toBe(false);
    
    // Store should still be functional
    const state = get(project);
    expect(state).toBeTruthy();
    expect(state.tracks).toBeTruthy();
    
    // Can still make changes
    project.setNoteRange(0, 0, 0, 1, true);
    const afterChange = get(project);
    expect(afterChange.tracks[0].notes[0][0]).toBe(true);
  });

  it('handles redo after multiple undo operations', () => {
    // Make changes
    project.setNoteRange(0, 0, 0, 1, true);
    project.setNoteRange(0, 1, 0, 1, true);
    project.setNoteRange(0, 2, 0, 1, true);
    
    // Undo all
    project.undo();
    project.undo();
    project.undo();
    
    // Redo them back
    expect(project.canRedo()).toBe(true);
    project.redo();
    const afterFirstRedo = get(project);
    expect(afterFirstRedo.tracks[0].notes[0][0]).toBe(true);
    
    expect(project.canRedo()).toBe(true);
    project.redo();
    const afterSecondRedo = get(project);
    expect(afterSecondRedo.tracks[0].notes[1][0]).toBe(true);
    
    expect(project.canRedo()).toBe(true);
    project.redo();
    const afterThirdRedo = get(project);
    expect(afterThirdRedo.tracks[0].notes[2][0]).toBe(true);
    
    // No more redo history
    expect(project.canRedo()).toBe(false);
    
    // Attempting to redo should not crash
    const result = project.redo();
    expect(result).toBe(false);
    
    // State should remain stable
    const finalState = get(project);
    expect(finalState).toBeTruthy();
  });

  it('ensures playheadStep is never NaN after undo', () => {
    // Make changes
    project.setNoteRange(0, 0, 0, 1, true);
    project.setNoteRange(0, 1, 0, 1, true);
    
    // Undo operations
    project.undo();
    const afterFirstUndo = get(project);
    expect(Number.isFinite(afterFirstUndo.playheadStep)).toBe(true);
    expect(Number.isNaN(afterFirstUndo.playheadStep)).toBe(false);
    expect(Number.isFinite(afterFirstUndo.playheadProgress)).toBe(true);
    expect(Number.isNaN(afterFirstUndo.playheadProgress)).toBe(false);
    
    project.undo();
    const afterSecondUndo = get(project);
    expect(Number.isFinite(afterSecondUndo.playheadStep)).toBe(true);
    expect(Number.isNaN(afterSecondUndo.playheadStep)).toBe(false);
    expect(Number.isFinite(afterSecondUndo.playheadProgress)).toBe(true);
    expect(Number.isNaN(afterSecondUndo.playheadProgress)).toBe(false);
  });

  it('handles loading snapshots with missing playhead fields', () => {
    // Create a snapshot without playhead fields (simulating old data)
    const incompleteSnapshot = {
      name: 'Test Project',
      rows: 8,
      bars: 4,
      stepsPerBar: 16,
      bpm: 120,
      follow: true,
      selectedTrack: 0,
      tracks: [
        {
          id: 1,
          name: 'Track 1',
          color: '#78D2B9',
          waveform: 'square',
          scale: 'major',
          octave: 4,
          volume: 0.7,
          customShape: 0.5,
          effects: {
            filterType: 'none',
            filterCutoff: 1800,
            filterQ: 0.7,
            delayMix: 0,
            delayTime: 0.28,
            delayFeedback: 0.35,
            reverbMix: 0,
            reverbTime: 1,
            bitcrushBits: 16,
            bitcrushRate: 1
          },
          adsr: { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 },
          rootNote: 0,
          mute: false,
          solo: false,
          notes: Array.from({ length: 8 }, () => Array.from({ length: 64 }, () => false))
        }
      ]
      // Note: playheadStep, playheadProgress, lastStepTime, nextStepTime are missing
    };
    
    // Load the incomplete snapshot
    const loaded = project.load(incompleteSnapshot);
    expect(loaded).toBe(true);
    
    // Verify that playhead fields are valid numbers
    const state = get(project);
    expect(Number.isFinite(state.playheadStep)).toBe(true);
    expect(Number.isNaN(state.playheadStep)).toBe(false);
    expect(Number.isFinite(state.playheadProgress)).toBe(true);
    expect(Number.isNaN(state.playheadProgress)).toBe(false);
    expect(Number.isFinite(state.lastStepTime)).toBe(true);
    expect(Number.isNaN(state.lastStepTime)).toBe(false);
    expect(Number.isFinite(state.nextStepTime)).toBe(true);
    expect(Number.isNaN(state.nextStepTime)).toBe(false);
  });
});
