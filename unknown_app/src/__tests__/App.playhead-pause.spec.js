import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { project } from '../store/projectStore.js';

describe('App playhead pause functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should preserve playhead position when stopping playback (not playing state)', () => {
    // Set playhead to step 16 (bar 2 in a 16-step-per-bar project)
    project.registerStep(16, 0, 0);
    project.setPlaying(true);

    let state = get(project);
    expect(state.playheadStep).toBe(16);
    expect(state.playing).toBe(true);

    // Stop playback - should NOT reset playhead
    project.setPlaying(false);

    state = get(project);
    // Playhead should remain at step 16, not reset to 0
    expect(state.playheadStep).toBe(16);
    expect(state.playing).toBe(false);
  });

  it('should allow skipping forward when paused', () => {
    const state = get(project);
    const stepsPerBar = state.stepsPerBar || 16;
    
    // Start at bar 1 (step 0)
    project.registerStep(0, 0, 0);
    project.setPlaying(false);

    expect(get(project).playheadStep).toBe(0);
    expect(get(project).playing).toBe(false);

    // Skip forward to next bar
    project.registerStep(stepsPerBar, 0, 0);

    expect(get(project).playheadStep).toBe(stepsPerBar);
    expect(get(project).playing).toBe(false);
  });

  it('should allow skipping backward when paused', () => {
    const state = get(project);
    const stepsPerBar = state.stepsPerBar || 16;
    
    // Start at bar 2 (step 16 in a 16-step-per-bar project)
    project.registerStep(stepsPerBar, 0, 0);
    project.setPlaying(false);

    expect(get(project).playheadStep).toBe(stepsPerBar);
    expect(get(project).playing).toBe(false);

    // Skip back to bar 1
    project.registerStep(0, 0, 0);

    expect(get(project).playheadStep).toBe(0);
    expect(get(project).playing).toBe(false);
  });

  it('should skip forward multiple bars when paused', () => {
    const state = get(project);
    const stepsPerBar = state.stepsPerBar || 16;
    
    // Start at bar 1
    project.registerStep(0, 0, 0);
    project.setPlaying(false);

    // Skip to bar 2
    project.registerStep(stepsPerBar, 0, 0);
    expect(get(project).playheadStep).toBe(stepsPerBar);

    // Skip to bar 3
    project.registerStep(stepsPerBar * 2, 0, 0);
    expect(get(project).playheadStep).toBe(stepsPerBar * 2);
    expect(get(project).playing).toBe(false);
  });

  it('should reset playhead when starting playback', () => {
    // Set playhead to a non-zero position
    project.registerStep(32, 0, 0);
    project.setPlaying(false);

    expect(get(project).playheadStep).toBe(32);
    expect(get(project).playing).toBe(false);

    // Start playback should reset playhead
    project.resetPlayhead();
    project.setPlaying(true);

    const state = get(project);
    expect(state.playheadStep).toBe(0);
    expect(state.playing).toBe(true);
  });

  it('should wrap to beginning when skipping forward past the end', () => {
    const state = get(project);
    const stepsPerBar = state.stepsPerBar || 16;
    const totalSteps = state.bars * stepsPerBar;
    const lastBarStep = totalSteps - stepsPerBar;
    
    // Set playhead to last bar
    project.registerStep(lastBarStep, 0, 0);
    project.setPlaying(false);

    expect(get(project).playheadStep).toBe(lastBarStep);

    // Skip forward - should wrap to 0
    project.registerStep(0, 0, 0);

    expect(get(project).playheadStep).toBe(0);
    expect(get(project).playing).toBe(false);
  });
});
