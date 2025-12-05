import { derived, get, writable } from 'svelte/store';

const DEMO_PATTERNS = [];

const DEMO_BLOCKS = [];

const INITIAL_PLAYBACK = {
  isPlaying: false,
  playheadBeat: 0,
  bpm: 110,
  beatsPerBar: 4,
  loopLengthBeats: 64
};

export const BEAT_SNAP = 1;
const PLAYBACK_INTERVAL_MS = 50;

let blockCounter = DEMO_BLOCKS.length + 1;
let playbackInterval;

export const patterns = writable([]);
export const blocks = writable([]);
export const playback = writable({ ...INITIAL_PLAYBACK });

export const blocksWithPattern = derived([blocks, patterns], ([$blocks, $patterns]) =>
  $blocks.map((block) => ({
    ...block,
    pattern: $patterns.find((pattern) => pattern.id === block.patternId)
  }))
);

const clonePatterns = () => DEMO_PATTERNS.map((pattern) => ({ ...pattern }));
const cloneBlocks = () => DEMO_BLOCKS.map((block) => ({ ...block }));

export const resetArrangerState = () => {
  patterns.set(clonePatterns());
  blocks.set(cloneBlocks());
  blockCounter = DEMO_BLOCKS.length + 1;
  
  // Clear any existing playback interval
  if (playbackInterval) {
    clearInterval(playbackInterval);
    playbackInterval = null;
  }
  
  playback.set({ ...INITIAL_PLAYBACK, isPlaying: false, playheadBeat: 0 });
};

resetArrangerState();

const snapBeat = (value) => {
  const snapped = Math.round(value / BEAT_SNAP) * BEAT_SNAP;
  return Math.max(0, snapped);
};

const getPatternById = (patternId) => get(patterns).find((pattern) => pattern.id === patternId);

const getLaneEndBeat = (lane) => {
  const patternMap = new Map(get(patterns).map((pattern) => [pattern.id, pattern.lengthInBeats]));
  return get(blocks)
    .filter((block) => block.lane === lane)
    .reduce((max, block) => Math.max(max, block.startBeat + (patternMap.get(block.patternId) ?? 0)), 0);
};

const getSafeStartBeat = (lane, desiredStart, patternLength, movingBlockId = null) => {
  const snapped = snapBeat(desiredStart);
  const laneBlocks = get(blocks)
    .filter((block) => block.lane === lane && block.id !== movingBlockId)
    .sort((a, b) => a.startBeat - b.startBeat);

  let startBeat = Math.max(0, snapped);

  for (const block of laneBlocks) {
    const blockPatternLength = getPatternById(block.patternId)?.lengthInBeats ?? 0;
    const blockEnd = block.startBeat + blockPatternLength;
    const overlaps = startBeat < blockEnd && startBeat + patternLength > block.startBeat;

    if (overlaps) {
      startBeat = blockEnd;
    }
  }

  return startBeat;
};

export const addPatternToLane = (patternId, lane = 0, explicitStartBeat = null) => {
  const pattern = getPatternById(patternId);
  if (!pattern) return;

  blocks.update((current) => {
    const laneEnd = explicitStartBeat ?? getLaneEndBeat(lane);
    const startBeat = getSafeStartBeat(lane, laneEnd, pattern.lengthInBeats);
    const newBlock = {
      id: `block-${blockCounter++}`,
      patternId,
      lane,
      startBeat
    };
    return [...current, newBlock];
  });
};

export const moveBlock = (blockId, { startBeat, lane } = {}) => {
  blocks.update((current) =>
    current.map((block) => {
      if (block.id !== blockId) return block;
      const nextLane = lane ?? block.lane;
      const desiredStart = startBeat ?? block.startBeat;
      const snappedStart = snapBeat(desiredStart);

      // Moving a block should honor the requested position while snapping to the beat grid.
      // Avoid auto-shifting to the end of overlapping blocks so manual moves behave predictably.
      return { ...block, lane: nextLane, startBeat: snappedStart };
    })
  );
};

export const removeBlock = (blockId) => {
  blocks.update((current) => current.filter((block) => block.id !== blockId));
};

export const setLoopLength = (beats) => {
  playback.update((state) => ({ ...state, loopLengthBeats: Math.max(beats, state.beatsPerBar) }));
};

const tickPlayhead = () => {
  playback.update((state) => {
    const beatsPerInterval = (state.bpm / 60) * (PLAYBACK_INTERVAL_MS / 1000);
    let nextBeat = state.playheadBeat + beatsPerInterval;
    if (nextBeat >= state.loopLengthBeats) {
      nextBeat = 0;
    }
    return { ...state, playheadBeat: nextBeat };
  });
};

export const startPlayback = () => {
  if (playbackInterval) return;
  playback.update((state) => ({ ...state, isPlaying: true }));
  playbackInterval = setInterval(tickPlayhead, PLAYBACK_INTERVAL_MS);
};

export const stopPlayback = () => {
  if (playbackInterval) {
    clearInterval(playbackInterval);
    playbackInterval = null;
  }
  playback.update((state) => ({ ...state, isPlaying: false, playheadBeat: 0 }));
};

export const setPlayheadBeat = (beat) => {
  playback.update((state) => ({ ...state, playheadBeat: snapBeat(Math.min(Math.max(beat, 0), state.loopLengthBeats)) }));
};
