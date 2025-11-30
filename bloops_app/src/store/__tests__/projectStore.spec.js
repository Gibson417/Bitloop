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
