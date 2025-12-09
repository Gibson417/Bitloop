import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { project, BASE_RESOLUTION } from '../projectStore.js';

describe('Track operations with patterns', () => {
  beforeEach(() => {
    // Reset to default state
    const defaultSnapshot = project.defaultSnapshot();
    project.load(defaultSnapshot);
  });

  it('should update patterns when adding a track', () => {
    // First capture a pattern so we have one to test with
    project.addPattern();
    
    const before = get(project);
    const tracksBefore = before.tracks.length;
    const patternsBefore = before.patterns.length;
    const patternTracksBefore = before.patterns[0].tracks.length;

    // Add a track
    project.addTrack();

    const after = get(project);
    expect(after.tracks.length).toBe(tracksBefore + 1);
    expect(after.patterns.length).toBe(patternsBefore); // Patterns count shouldn't change
    expect(after.patterns[after.selectedPattern].tracks.length).toBe(tracksBefore + 1); // Pattern should have updated tracks
  });

  it('should create new track with correct storage size', () => {
    const before = get(project);
    const expectedStorageSteps = before.bars * BASE_RESOLUTION;

    // Add a track
    project.addTrack();

    const after = get(project);
    const newTrack = after.tracks[after.tracks.length - 1];
    expect(newTrack.notes[0].length).toBe(expectedStorageSteps);
  });

  it('should update patterns when duplicating a track', () => {
    // First capture a pattern so we have one to test with
    project.addPattern();
    
    const before = get(project);
    const tracksBefore = before.tracks.length;
    const patternTracksBefore = before.patterns[0].tracks.length;

    // Duplicate track 0
    project.duplicateTrack(0);

    const after = get(project);
    expect(after.tracks.length).toBe(tracksBefore + 1);
    expect(after.patterns[after.selectedPattern].tracks.length).toBe(tracksBefore + 1); // Pattern should have updated tracks
  });

  it('should preserve notes when duplicating a track', () => {
    // Add a note to track 0
    project.toggleNote(0, 0, 0, true);
    
    const before = get(project);
    const originalTrack = before.tracks[0];
    const hasNote = originalTrack.notes[0][0];
    expect(hasNote).toBe(true);

    // Duplicate track 0
    project.duplicateTrack(0);

    const after = get(project);
    const duplicatedTrack = after.tracks[after.tracks.length - 1];
    expect(duplicatedTrack.notes[0][0]).toBe(true); // Note should be preserved
    expect(duplicatedTrack.name).toContain('Copy');
  });

  it('should update patterns when removing a track', () => {
    // First capture a pattern so we have one to test with
    project.addPattern();
    
    // Add a track first so we have more than minimum
    project.addTrack();
    
    const before = get(project);
    const tracksBefore = before.tracks.length;
    const patternTracksBefore = before.patterns[0].tracks.length;

    // Remove track 1
    project.removeTrack(1);

    const after = get(project);
    expect(after.tracks.length).toBe(tracksBefore - 1);
    expect(after.patterns[after.selectedPattern].tracks.length).toBe(tracksBefore - 1); // Pattern should have updated tracks
  });

  it('should allow removing last track', () => {
    // Load a state with only 1 track
    project.load({
      name: 'Test',
      rows: 8,
      bars: 2,
      stepsPerBar: 16,
      bpm: 120,
      tracks: [{ id: 1, name: 'Track 1', scale: 'major', octave: 4, volume: 0.7, waveform: 'square' }]
    });

    const before = get(project);
    expect(before.tracks.length).toBe(1);

    // Remove the only track
    project.removeTrack(0);

    const after = get(project);
    expect(after.tracks.length).toBe(0); // Should now have 0 tracks
  });

  it('should not exceed MAX_TRACKS limit', () => {
    // Add tracks up to the limit (we start with 2)
    const maxTracks = 16; // MAX_TRACKS from projectStore.js
    const before = get(project);
    const tracksToAdd = maxTracks - before.tracks.length;

    for (let i = 0; i < tracksToAdd; i++) {
      project.addTrack();
    }

    const atLimit = get(project);
    expect(atLimit.tracks.length).toBe(maxTracks);

    // Try to add one more
    project.addTrack();

    const after = get(project);
    expect(after.tracks.length).toBe(maxTracks); // Should still be at limit
  });
});
