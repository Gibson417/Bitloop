import { describe, it, expect, beforeEach } from 'vitest';
import { project, totalSteps, loopDuration } from '../projectStore.js';
import { get } from 'svelte/store';

const resetStore = () => {
  const snapshot = project.serialize();
  project.load(snapshot);
};

describe('project store', () => {
  beforeEach(() => {
    resetStore();
  });

  it('sets note ranges within bounds', () => {
    const before = get(project);
    expect(before.tracks[0].notes[0][0]).toBe(false);
    project.setNoteRange(0, 0, 0, 4, true);
    const afterAdd = get(project);
    expect(afterAdd.tracks[0].notes[0].slice(0, 4).every(Boolean)).toBe(true);
    project.setNoteRange(0, 0, 0, 4, false);
    const afterRemove = get(project);
    expect(afterRemove.tracks[0].notes[0].slice(0, 4).every((cell) => cell === false)).toBe(true);
  });

  it('clamps bars when exceeding five minute limit', () => {
    const initialSteps = get(totalSteps);
    expect(initialSteps).toBeGreaterThan(0);
    project.setBpm(60);
    project.setBars(400);
    const state = get(project);
    const seconds = get(loopDuration);
    expect(state.bars).toBeLessThanOrEqual(300);
    expect(seconds).toBeLessThanOrEqual(300);
    // Ensure the clamped value is also even
    expect(state.bars % 2).toBe(0);
  });

  it('ensures bars are always even numbers', () => {
    // Test odd numbers are rounded up to even
    project.setBars(3);
    expect(get(project).bars).toBe(4);
    
    project.setBars(5);
    expect(get(project).bars).toBe(6);
    
    project.setBars(7);
    expect(get(project).bars).toBe(8);
    
    // Test even numbers stay the same
    project.setBars(2);
    expect(get(project).bars).toBe(2);
    
    project.setBars(4);
    expect(get(project).bars).toBe(4);
    
    project.setBars(10);
    expect(get(project).bars).toBe(10);
    
    // Test minimum is enforced (bars cannot be less than 2)
    project.setBars(0);
    expect(get(project).bars).toBe(2);
    
    project.setBars(1);
    expect(get(project).bars).toBe(2);
  });

  it('ensures loaded projects have even bars', () => {
    const snapshot = {
      name: 'Test Project',
      rows: 8,
      bars: 3, // odd number
      stepsPerBar: 16,
      bpm: 120,
      tracks: []
    };
    project.load(snapshot);
    const state = get(project);
    expect(state.bars).toBe(4); // should be rounded up to 4
  });

  it('enforces solo exclusivity', () => {
    // Add a second track for testing solo exclusivity
    project.addTrack();
    project.setTrackSetting(0, 'solo', true);
    project.setTrackSetting(1, 'solo', true);
    const state = get(project);
    expect(state.tracks[0].solo).toBe(false);
    expect(state.tracks[1].solo).toBe(true);
  });
});
