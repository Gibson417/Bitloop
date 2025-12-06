import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  addPatternToLane,
  blocks,
  moveBlock,
  playback,
  patterns,
  resetArrangerState,
  startPlayback,
  stopPlayback
} from '../arrangerStore.js';

describe('arrangerStore', () => {
  beforeEach(() => {
    resetArrangerState();
    // Set up test patterns
    patterns.set([
      { id: 'bridge', name: 'Bridge', color: '#78d2b9', lengthInBeats: 8 }
    ]);
  });

  afterEach(() => {
    stopPlayback();
    vi.useRealTimers();
  });

  it('adds blocks snapped to the beat grid', () => {
    addPatternToLane('bridge', 0, 5.4);
    const list = get(blocks);
    const added = list.find((block) => block.patternId === 'bridge' && block.startBeat !== 0);
    expect(added).toBeTruthy();
    expect(added.startBeat % 1).toBe(0);
  });

  it('moves blocks and snaps to beats', () => {
    addPatternToLane('bridge', 0, 0);
    const initial = get(blocks)[0];
    moveBlock(initial.id, { startBeat: 3.2 });
    const updated = get(blocks).find((block) => block.id === initial.id);
    expect(updated.startBeat).toBe(3);
  });

  it('advances the playhead when playback is running', () => {
    vi.useFakeTimers();
    const startBeat = get(playback).playheadBeat;
    startPlayback();
    vi.advanceTimersByTime(400);
    const nextBeat = get(playback).playheadBeat;
    expect(nextBeat).toBeGreaterThan(startBeat);
  });
});

describe('arrangerStore - sequential pattern placement', () => {
  beforeEach(() => {
    resetArrangerState();
    // Set up some test patterns
    patterns.set([
      { id: 'p1', name: 'Pattern 1', color: '#78d2b9', lengthInBeats: 8 },
      { id: 'p2', name: 'Pattern 2', color: '#ff6b9d', lengthInBeats: 8 },
      { id: 'p3', name: 'Pattern 3', color: '#ffd93d', lengthInBeats: 8 }
    ]);
  });

  it('should add first pattern at beat 0', () => {
    addPatternToLane('p1');
    const currentBlocks = get(blocks);
    expect(currentBlocks).toHaveLength(1);
    expect(currentBlocks[0].startBeat).toBe(0);
    expect(currentBlocks[0].lane).toBe(0);
  });

  it('should add second pattern after first pattern ends', () => {
    addPatternToLane('p1'); // 8 beats long, at beat 0
    addPatternToLane('p2'); // 8 beats long, should be at beat 8
    const currentBlocks = get(blocks);
    expect(currentBlocks).toHaveLength(2);
    expect(currentBlocks[0].startBeat).toBe(0);
    expect(currentBlocks[1].startBeat).toBe(8);
    expect(currentBlocks[0].lane).toBe(0);
    expect(currentBlocks[1].lane).toBe(0);
  });

  it('should add third pattern sequentially after second', () => {
    addPatternToLane('p1'); // at beat 0
    addPatternToLane('p2'); // at beat 8
    addPatternToLane('p3'); // should be at beat 16
    const currentBlocks = get(blocks);
    expect(currentBlocks).toHaveLength(3);
    expect(currentBlocks[0].startBeat).toBe(0);
    expect(currentBlocks[1].startBeat).toBe(8);
    expect(currentBlocks[2].startBeat).toBe(16);
    // All should be on lane 0
    expect(currentBlocks[0].lane).toBe(0);
    expect(currentBlocks[1].lane).toBe(0);
    expect(currentBlocks[2].lane).toBe(0);
  });

  it('should place all patterns in the same lane (lane 0)', () => {
    addPatternToLane('p1');
    addPatternToLane('p2');
    addPatternToLane('p3');
    const currentBlocks = get(blocks);
    const lanes = [...new Set(currentBlocks.map(b => b.lane))];
    expect(lanes).toEqual([0]);
  });

  it('should respect the lane parameter when adding patterns', () => {
    // Add patterns to different lanes
    addPatternToLane('p1', 0);
    addPatternToLane('p2', 1);
    addPatternToLane('p3', 2);
    const currentBlocks = get(blocks);
    expect(currentBlocks[0].lane).toBe(0);
    expect(currentBlocks[1].lane).toBe(1);
    expect(currentBlocks[2].lane).toBe(2);
  });

  it('should respect the lane parameter when moving blocks', () => {
    addPatternToLane('p1', 0);
    const block = get(blocks)[0];
    moveBlock(block.id, { lane: 2, startBeat: 4 });
    const updated = get(blocks)[0];
    expect(updated.lane).toBe(2);
    expect(updated.startBeat).toBe(4);
  });

  it('should prevent blocks from overlapping when dragging', () => {
    // Add two patterns at beats 0 and 8
    addPatternToLane('p1', 0, 0);  // 8 beats long, at beat 0
    addPatternToLane('p2', 0, 8);  // 8 beats long, at beat 8
    
    const currentBlocks = get(blocks);
    const block1 = currentBlocks[0];
    const block2 = currentBlocks[1];
    
    // Try to move block2 to beat 4 (would overlap with block1 which ends at beat 8)
    moveBlock(block2.id, { startBeat: 4 });
    
    const updatedBlocks = get(blocks);
    const movedBlock = updatedBlocks.find(b => b.id === block2.id);
    
    // Block should either be placed at beat 0 (before block1) or stay at beat 8 (after block1)
    // It should NOT be at beat 4 which would cause overlap
    expect(movedBlock.startBeat === 0 || movedBlock.startBeat >= 8).toBe(true);
    expect(movedBlock.startBeat).not.toBe(4);
  });

  it('should allow swapping block positions when dragging', () => {
    // Add two patterns
    addPatternToLane('p1', 0, 0);  // at beat 0
    addPatternToLane('p2', 0, 8);  // at beat 8
    
    const currentBlocks = get(blocks);
    const block2 = currentBlocks[1];
    
    // Try to move block2 to a position that overlaps with block1
    moveBlock(block2.id, { startBeat: 0 });
    
    const updatedBlocks = get(blocks);
    const movedBlock = updatedBlocks.find(b => b.id === block2.id);
    
    // Since there's no space before block1, block2 should remain at beat 8
    // This prevents overlap while keeping blocks in valid positions
    expect(movedBlock.startBeat).toBe(8);
  });

  it('should swap positions when there is enough space', () => {
    // Add pattern at beat 16 with gap before it
    addPatternToLane('p1', 0, 16);  // 8 beats long, at beat 16
    addPatternToLane('p2', 0, 24);  // 8 beats long, at beat 24
    
    const currentBlocks = get(blocks);
    const block2 = currentBlocks[1];
    
    // Try to move block2 to beat 12 (would overlap with block1 at 16-24)
    // There's enough space before block1 (0-16), so it should fit at beat 8
    moveBlock(block2.id, { startBeat: 12 });
    
    const updatedBlocks = get(blocks);
    const movedBlock = updatedBlocks.find(b => b.id === block2.id);
    
    // Block2 should be placed before block1, at beat 8 (16 - 8)
    expect(movedBlock.startBeat).toBe(8);
  });
});
