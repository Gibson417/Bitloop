import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  addPatternToLane,
  blocks,
  moveBlock,
  playback,
  resetArrangerState,
  startPlayback,
  stopPlayback
} from '../arrangerStore.js';

describe('arrangerStore', () => {
  beforeEach(() => {
    resetArrangerState();
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
