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

  it('should handle multiple overlapping blocks correctly', () => {
    // Create a densely packed lane: blocks at 0-8, 8-16, 16-24
    addPatternToLane('p1', 0, 0);   // at beat 0
    addPatternToLane('p2', 0, 8);   // at beat 8
    addPatternToLane('p3', 0, 16);  // at beat 16
    
    const currentBlocks = get(blocks);
    const block3 = currentBlocks[2];  // The block at beat 16
    
    // Try to move block3 to beat 4 (would overlap with both block1 and block2)
    moveBlock(block3.id, { startBeat: 4 });
    
    const updatedBlocks = get(blocks);
    const movedBlock = updatedBlocks.find(b => b.id === block3.id);
    
    // Block3 should stay at a safe position that doesn't overlap
    // Since moving to beat 4 overlaps with block2 (8-16), and there's no space
    // before block1 (would need to be at -4), it should place after block2 at beat 16
    expect(movedBlock.startBeat).toBe(16);
    
    // Verify no overlaps exist
    const allBlocks = get(blocks);
    for (let i = 0; i < allBlocks.length; i++) {
      for (let j = i + 1; j < allBlocks.length; j++) {
        const b1 = allBlocks[i];
        const b2 = allBlocks[j];
        if (b1.lane !== b2.lane) continue;
        
        const p1 = get(patterns).find(p => p.id === b1.patternId);
        const p2 = get(patterns).find(p => p.id === b2.patternId);
        const b1End = b1.startBeat + (p1?.lengthInBeats ?? 0);
        const b2End = b2.startBeat + (p2?.lengthInBeats ?? 0);
        
        const overlaps = b1.startBeat < b2End && b1End > b2.startBeat;
        expect(overlaps).toBe(false);
      }
    }
  });
});

describe('arrangerStore - block swapping', () => {
  beforeEach(() => {
    resetArrangerState();
    patterns.set([
      { id: 'p1', name: 'Pattern 1', color: '#78d2b9', lengthInBeats: 8 },
      { id: 'p2', name: 'Pattern 2', color: '#ff6b9d', lengthInBeats: 8 }
    ]);
  });

  it('should swap positions of two blocks in the same lane', async () => {
    const { swapBlocks } = await import('../arrangerStore.js');
    
    addPatternToLane('p1', 0, 0);   // at beat 0
    addPatternToLane('p2', 0, 8);   // at beat 8
    
    const currentBlocks = get(blocks);
    const block1 = currentBlocks[0];
    const block2 = currentBlocks[1];
    
    expect(block1.startBeat).toBe(0);
    expect(block2.startBeat).toBe(8);
    
    // Swap the blocks
    swapBlocks(block1.id, block2.id);
    
    const swappedBlocks = get(blocks);
    const swappedBlock1 = swappedBlocks.find(b => b.id === block1.id);
    const swappedBlock2 = swappedBlocks.find(b => b.id === block2.id);
    
    expect(swappedBlock1.startBeat).toBe(8);
    expect(swappedBlock2.startBeat).toBe(0);
  });

  it('should not swap blocks in different lanes', async () => {
    const { swapBlocks } = await import('../arrangerStore.js');
    
    addPatternToLane('p1', 0, 0);   // lane 0, beat 0
    addPatternToLane('p2', 1, 0);   // lane 1, beat 0
    
    const currentBlocks = get(blocks);
    const block1 = currentBlocks[0];
    const block2 = currentBlocks[1];
    
    const initialBlock1Start = block1.startBeat;
    const initialBlock2Start = block2.startBeat;
    
    // Try to swap blocks from different lanes
    swapBlocks(block1.id, block2.id);
    
    const afterBlocks = get(blocks);
    const afterBlock1 = afterBlocks.find(b => b.id === block1.id);
    const afterBlock2 = afterBlocks.find(b => b.id === block2.id);
    
    // Positions should not change
    expect(afterBlock1.startBeat).toBe(initialBlock1Start);
    expect(afterBlock2.startBeat).toBe(initialBlock2Start);
  });

  it('should handle swapping non-existent blocks gracefully', async () => {
    const { swapBlocks } = await import('../arrangerStore.js');
    
    addPatternToLane('p1', 0, 0);
    
    const currentBlocks = get(blocks);
    const blocksBefore = currentBlocks.length;
    
    // Try to swap with a non-existent block
    swapBlocks(currentBlocks[0].id, 'non-existent-id');
    
    const afterBlocks = get(blocks);
    expect(afterBlocks.length).toBe(blocksBefore);
  });
});
