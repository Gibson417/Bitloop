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

  it('toggles notes within bounds', () => {
    const before = get(project);
    expect(before.tracks[0].notes[0][0]).toBe(false);
    project.toggleNote(0, 0, 0, true);
    const after = get(project);
    expect(after.tracks[0].notes[0][0]).toBe(true);
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
    project.setTrackSetting(0, 'solo', true);
    project.setTrackSetting(1, 'solo', true);
    const state = get(project);
    expect(state.tracks[0].solo).toBe(false);
    expect(state.tracks[1].solo).toBe(true);
  });
});
