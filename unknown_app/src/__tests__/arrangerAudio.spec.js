import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { playback, blocks, patterns, blocksWithPattern, startPlayback, stopPlayback, addPatternToLane } from '../store/arrangerStore.js';

describe('Arranger audio playback integration', () => {
  it('should have playback state with expected properties', () => {
    const state = get(playback);
    expect(state).toHaveProperty('isPlaying');
    expect(state).toHaveProperty('playheadBeat');
    expect(state).toHaveProperty('bpm');
    expect(state).toHaveProperty('beatsPerBar');
    expect(state).toHaveProperty('loopLengthBeats');
  });

  it('should start playback and update isPlaying state', () => {
    stopPlayback(); // ensure clean state
    startPlayback();
    const state = get(playback);
    expect(state.isPlaying).toBe(true);
    stopPlayback();
  });

  it('should stop playback and update isPlaying state', () => {
    startPlayback();
    stopPlayback();
    const state = get(playback);
    expect(state.isPlaying).toBe(false);
  });

  it('should allow adding pattern blocks to lanes', () => {
    // Set up test pattern
    patterns.set([
      { id: 'test-pattern-1', name: 'Test Pattern', color: '#78d2b9', lengthInBeats: 8 }
    ]);
    
    // Clear existing blocks
    blocks.set([]);
    
    // Add pattern to lane
    addPatternToLane('test-pattern-1', 0);
    
    const currentBlocks = get(blocks);
    expect(currentBlocks.length).toBe(1);
    expect(currentBlocks[0].patternId).toBe('test-pattern-1');
    expect(currentBlocks[0].lane).toBe(0);
  });

  it('should have blocksWithPattern derived store that combines blocks and patterns', () => {
    patterns.set([
      { id: 'test-pattern-1', name: 'Test Pattern', color: '#78d2b9', lengthInBeats: 8 }
    ]);
    
    blocks.set([
      { id: 'block-1', patternId: 'test-pattern-1', lane: 0, startBeat: 0 }
    ]);
    
    const blocksWithPat = get(blocksWithPattern);
    
    expect(blocksWithPat.length).toBe(1);
    expect(blocksWithPat[0]).toHaveProperty('pattern');
    expect(blocksWithPat[0].pattern.id).toBe('test-pattern-1');
  });
});
