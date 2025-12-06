import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { project } from '../store/projectStore.js';

describe('Pattern minimum bars', () => {
  it('should enforce minimum of 2 bars when setting bars', () => {
    // Try to set bars to 1
    project.setBars(1);
    const state = get(project);
    
    // Should be clamped to minimum of 2
    expect(state.bars).toBe(2);
  });
  
  it('should enforce minimum of 2 bars when setting bars to 0', () => {
    project.setBars(0);
    const state = get(project);
    
    // Should be clamped to minimum of 2
    expect(state.bars).toBe(2);
  });
  
  it('should allow setting bars to values >= 2', () => {
    project.setBars(4);
    const state = get(project);
    
    expect(state.bars).toBe(4);
  });
});
