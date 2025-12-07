import { writable, derived, get } from 'svelte/store';
import { scales, isValidCustomScale } from '../lib/scales.js';

export const MAX_LOOP_SECONDS = 300;
// Base resolution per bar for internal storage. All notes are stored at this resolution.
// Doubled from 64 to 128 to allow 64th notes to have articulation gaps (128/64 = 2 steps, reduced by 1 = 1 step)
export const BASE_RESOLUTION = 128;

// Note event structure: { row: number, start: number, length: number }
// start and length are in 128th-note storage steps (0..bars*BASE_RESOLUTION-1)

const DEFAULT_NAME = 'Untitled loop';
const DEFAULT_ROWS = 8;
const DEFAULT_BARS = 2;
const DEFAULT_STEPS_PER_BAR = 16;
const DEFAULT_BPM = 120;
const DEFAULT_FOLLOW = true;
const MAX_TRACKS = 16; // Increased from 10 to 16
const MAX_HISTORY = 100;
const TRACK_COLORS = [
  '#78D2B9', '#A88EF6', '#F6C58E', '#F68EAF', '#8EF6D1', '#F6E58E',
  '#8EAFF6', '#F68E8E', '#D18EF6', '#8EF6AF', '#F6AF8E', '#AF8EF6',
  '#8ED1F6', '#F6D18E', '#8EF68E', '#F68ED1'
];
const DEFAULT_CUSTOM_SHAPE = 0.5;
const EFFECT_FILTER_TYPES = new Set(['none', 'lowpass', 'highpass', 'bandpass']);
const DEFAULT_ADSR = {
  attack: 0.01,
  decay: 0.1,
  sustain: 0.7,
  release: 0.3
};
const DEFAULT_EFFECTS = {
  filterType: 'none',
  filterCutoff: 1800,
  filterQ: 0.7,
  delayMix: 0,
  delayTime: 0.28,
  delayFeedback: 0.35,
  reverbMix: 0,
  reverbTime: 1,
  bitcrushBits: 16,
  bitcrushRate: 1
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const sanitizeName = (name) => {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  return trimmed.length ? trimmed : DEFAULT_NAME;
};

const createEmptyPattern = (rows, steps) =>
  Array.from({ length: rows }, () => Array.from({ length: steps }, () => false));

const sanitizeCustomShape = (value) => {
  const numeric = Number.isFinite(value) ? value : parseFloat(value);
  if (!Number.isFinite(numeric)) return DEFAULT_CUSTOM_SHAPE;
  return clamp(numeric, 0, 1);
};

const sanitizeEffects = (effects = {}) => {
  const filterType = EFFECT_FILTER_TYPES.has(effects.filterType) ? effects.filterType : DEFAULT_EFFECTS.filterType;
  const cutoffValue = Number.parseFloat(effects.filterCutoff);
  const filterCutoff = clamp(Number.isFinite(cutoffValue) ? cutoffValue : DEFAULT_EFFECTS.filterCutoff, 80, 8000);
  const qValue = Number.parseFloat(effects.filterQ);
  const filterQ = clamp(Number.isFinite(qValue) ? qValue : DEFAULT_EFFECTS.filterQ, 0.1, 20);
  const mixValue = Number.parseFloat(effects.delayMix);
  const delayMix = clamp(Number.isFinite(mixValue) ? mixValue : DEFAULT_EFFECTS.delayMix, 0, 0.9);
  const timeValue = Number.parseFloat(effects.delayTime);
  const delayTime = clamp(Number.isFinite(timeValue) ? timeValue : DEFAULT_EFFECTS.delayTime, 0.05, 0.8);
  const feedbackValue = Number.parseFloat(effects.delayFeedback);
  const delayFeedback = clamp(Number.isFinite(feedbackValue) ? feedbackValue : DEFAULT_EFFECTS.delayFeedback, 0, 0.9);
  const reverbMixValue = Number.parseFloat(effects.reverbMix);
  const reverbMix = clamp(Number.isFinite(reverbMixValue) ? reverbMixValue : DEFAULT_EFFECTS.reverbMix, 0, 1);
  const reverbTimeValue = Number.parseFloat(effects.reverbTime);
  const reverbTime = clamp(Number.isFinite(reverbTimeValue) ? reverbTimeValue : DEFAULT_EFFECTS.reverbTime, 0.1, 5);
  const bitcrushBitsValue = Number.parseFloat(effects.bitcrushBits);
  const bitcrushBits = clamp(Number.isFinite(bitcrushBitsValue) ? bitcrushBitsValue : DEFAULT_EFFECTS.bitcrushBits, 1, 16);
  const bitcrushRateValue = Number.parseFloat(effects.bitcrushRate);
  const bitcrushRate = clamp(Number.isFinite(bitcrushRateValue) ? bitcrushRateValue : DEFAULT_EFFECTS.bitcrushRate, 1, 50);
  return { 
    filterType, filterCutoff, filterQ, 
    delayMix, delayTime, delayFeedback,
    reverbMix, reverbTime,
    bitcrushBits, bitcrushRate
  };
};

const sanitizeAdsr = (adsr = {}) => {
  const attackValue = Number.parseFloat(adsr.attack);
  const attack = clamp(Number.isFinite(attackValue) ? attackValue : DEFAULT_ADSR.attack, 0.001, 2);
  const decayValue = Number.parseFloat(adsr.decay);
  const decay = clamp(Number.isFinite(decayValue) ? decayValue : DEFAULT_ADSR.decay, 0.001, 2);
  const sustainValue = Number.parseFloat(adsr.sustain);
  const sustain = clamp(Number.isFinite(sustainValue) ? sustainValue : DEFAULT_ADSR.sustain, 0, 1);
  const releaseValue = Number.parseFloat(adsr.release);
  const release = clamp(Number.isFinite(releaseValue) ? releaseValue : DEFAULT_ADSR.release, 0.001, 5);
  return { attack, decay, sustain, release };
};

// Convert boolean matrix to note events
// Returns array of { row, start, length } for each track row
const booleanToEvents = (booleanMatrix, rows) => {
  const result = [];
  for (let row = 0; row < rows; row++) {
    const rowNotes = booleanMatrix[row] ?? [];
    const rowEvents = [];
    let noteStart = -1;
    
    for (let step = 0; step < rowNotes.length; step++) {
      if (rowNotes[step]) {
        if (noteStart === -1) {
          noteStart = step;
        }
      } else if (noteStart !== -1) {
        // End of note
        rowEvents.push({ row, start: noteStart, length: step - noteStart });
        noteStart = -1;
      }
    }
    
    // Handle note that extends to end
    if (noteStart !== -1) {
      rowEvents.push({ row, start: noteStart, length: rowNotes.length - noteStart });
    }
    
    result.push(...rowEvents);
  }
  return result;
};

// Convert note events to boolean matrix
// events: array of { row, start, length }
// Returns 2D boolean array [rows][steps]
const eventsToBooleans = (events, rows, storageSteps) => {
  const matrix = Array.from({ length: rows }, () => Array.from({ length: storageSteps }, () => false));
  
  for (const event of events) {
    const { row, start, length } = event;
    if (row < 0 || row >= rows) continue;
    
    const safeStart = clamp(Math.floor(start), 0, storageSteps - 1);
    const safeLength = Math.max(1, Math.floor(length));
    const end = Math.min(safeStart + safeLength, storageSteps);
    
    for (let step = safeStart; step < end; step++) {
      matrix[row][step] = true;
    }
  }
  
  return matrix;
};

// Get all note events from a track's boolean matrix
export const getTrackEvents = (track, rows) => {
  if (!track || !track.notes) return [];
  return booleanToEvents(track.notes, rows);
};

// Set track notes from events
export const setTrackFromEvents = (events, rows, storageSteps) => {
  return eventsToBooleans(events, rows, storageSteps);
};

const resizeTrack = (track, rows, storageSteps) => {
  const notes = Array.from({ length: rows }, (_, rowIndex) => {
    const row = track.notes?.[rowIndex] ?? [];
    const resized = row.slice(0, storageSteps);
    if (resized.length < storageSteps) {
      resized.push(...Array.from({ length: storageSteps - resized.length }, () => false));
    }
    return resized;
  });
  return { ...track, notes };
};

const normalizeTracks = (tracks, rows, storageSteps) => {
  const safeTracks = Array.isArray(tracks) && tracks.length > 0 ? tracks.slice(0, MAX_TRACKS) : [];
  const fallback = safeTracks.length ? safeTracks : [createTrack(0, rows, storageSteps)];
  return fallback.map((track, index) => {
    const color = track.color ?? TRACK_COLORS[index % TRACK_COLORS.length];
    const waveform = track.waveform ?? 'square';
    
    // Support both named scales and custom scales
    let scaleName = 'major';
    let customScale = null;
    
    if (track.scale === 'custom' && Array.isArray(track.customScale)) {
      // Validate custom scale
      if (isValidCustomScale(track.customScale)) {
        scaleName = 'custom';
        customScale = [...track.customScale];
      }
    } else if (scales[track.scale]) {
      scaleName = track.scale;
    }
    
    const octave = clamp(track.octave ?? 4, 1, 7);
    const volume = clamp(track.volume ?? 0.7, 0, 1);
    const id = track.id ?? index + 1;
    const name = track.name ?? `Track ${index + 1}`;
    const customShape = sanitizeCustomShape(track.customShape);
    const effects = sanitizeEffects(track.effects);
    const adsr = sanitizeAdsr(track.adsr);
    const rootNote = clamp(track.rootNote ?? 0, 0, 11);
    return resizeTrack(
      {
        id,
        name,
        color,
        waveform,
        scale: scaleName,
        customScale,
        octave,
        volume,
        customShape,
        effects,
        adsr,
        rootNote,
        mute: !!track.mute,
        solo: !!track.solo,
        notes: track.notes ?? createEmptyPattern(rows, storageSteps)
      },
      rows,
      storageSteps
    );
  });
};

const createTrack = (index, rows, storageSteps) =>
  resizeTrack(
    {
      id: index + 1,
      name: `Track ${index + 1}`,
      color: TRACK_COLORS[index % TRACK_COLORS.length],
      waveform: 'square',
      scale: 'major',
      customScale: null,
      octave: 4,
      volume: 0.7,
      customShape: DEFAULT_CUSTOM_SHAPE,
      effects: { ...DEFAULT_EFFECTS },
      adsr: { ...DEFAULT_ADSR },
      rootNote: 0,
      mute: false,
      solo: false,
      notes: createEmptyPattern(rows, storageSteps)
    },
    rows,
    storageSteps
  );

const calculateSecondsPerBar = (bpm) => 240 / bpm;

const calculateMaxBars = (bpm) => {
  const secondsPerBar = calculateSecondsPerBar(bpm);
  return Math.max(1, Math.floor(MAX_LOOP_SECONDS / secondsPerBar));
};

const ensureEvenBars = (bars, min = 2) => {
  const rounded = Math.round(bars);
  // If odd, round up to next even number
  return rounded % 2 === 0 ? rounded : rounded + 1;
};

const ensureBarsWithinLimit = (bpm, desiredBars) => {
  const maxBars = calculateMaxBars(bpm);
  const clampedBars = Math.min(desiredBars, maxBars);
  // Ensure the result is an even number
  const evenBars = ensureEvenBars(clampedBars);
  // If rounding up exceeds maxBars, round down instead
  return evenBars > maxBars ? evenBars - 2 : evenBars;
};

const ensurePositiveInteger = (value, fallback, min = 1, max = Number.POSITIVE_INFINITY) => {
  const parsed = Number.isFinite(value) ? value : parseInt(value, 10);
  if (Number.isFinite(parsed)) {
    return clamp(Math.round(parsed), min, max);
  }
  return clamp(fallback, min, max);
};

const snapshotTracks = (tracks) =>
  tracks.map((track) => ({
    id: track.id,
    name: track.name,
    color: track.color,
    waveform: track.waveform,
    scale: track.scale,
    customScale: track.customScale ? [...track.customScale] : null,
    octave: track.octave,
    volume: track.volume,
    customShape: track.customShape,
    effects: { ...track.effects },
    adsr: { ...track.adsr },
    rootNote: track.rootNote,
    mute: track.mute,
    solo: track.solo,
    notes: track.notes.map((row) => row.slice())
  }));

// Pattern management helpers
const createPattern = (id, name, bars, rows, storageSteps, tracks = null) => ({
  id: id || `pattern-${Date.now()}`,
  name: name || `Pattern ${id}`,
  bars,
  tracks: tracks || [createTrack(0, rows, storageSteps)]
});

const snapshotPattern = (pattern) => ({
  id: pattern.id,
  name: pattern.name,
  bars: pattern.bars,
  tracks: snapshotTracks(pattern.tracks)
});

const snapshotPatterns = (patterns) => patterns.map(snapshotPattern);

const normalizePattern = (pattern, rows, bpm, stateBars = null) => {
  // Use stateBars if provided (when synchronizing with global state), otherwise use pattern's own bars
  const patternBars = stateBars !== null ? stateBars : pattern.bars;
  const bars = ensureBarsWithinLimit(bpm, ensurePositiveInteger(patternBars, DEFAULT_BARS, 2, 512));
  const storageSteps = bars * BASE_RESOLUTION;
  const tracks = normalizeTracks(pattern.tracks, rows, storageSteps);
  return {
    id: pattern.id || `pattern-${Date.now()}`,
    name: sanitizeName(pattern.name || 'Pattern'),
    bars,
    tracks
  };
};

const normalizePatterns = (patterns, rows, bpm, stateBars = null) => {
  if (!Array.isArray(patterns) || patterns.length === 0) {
    const defaultBars = stateBars !== null ? stateBars : ensureBarsWithinLimit(bpm, DEFAULT_BARS);
    const storageSteps = defaultBars * BASE_RESOLUTION;
    return [createPattern('A', 'Pattern A', defaultBars, rows, storageSteps)];
  }
  return patterns.map(p => normalizePattern(p, rows, bpm, stateBars));
};

// Coerce stepsPerBar to valid values (8, 16, 32, 64) for proper 4/4 time alignment
// If the value is not one of these, round to the nearest valid value
const coerceStepsPerBar = (value) => {
  const validValues = [8, 16, 32, 64];
  const numValue = ensurePositiveInteger(value, DEFAULT_STEPS_PER_BAR, 8, 64);
  
  // Find the closest valid value
  return validValues.reduce((closest, validValue) => {
    const currentDiff = Math.abs(numValue - validValue);
    const closestDiff = Math.abs(numValue - closest);
    return currentDiff < closestDiff ? validValue : closest;
  }, validValues[0]);
};

const toSnapshot = (state) => ({
  version: 5, // Increment version for BASE_RESOLUTION change (64 → 128)
  name: state.name,
  rows: state.rows,
  bars: state.bars,
  stepsPerBar: state.stepsPerBar,
  bpm: state.bpm,
  follow: state.follow,
  selectedTrack: state.selectedTrack,
  tracks: snapshotTracks(state.tracks),
  // Pattern support (optional for backwards compatibility)
  patterns: state.patterns ? snapshotPatterns(state.patterns) : undefined,
  selectedPattern: state.selectedPattern ?? 0,
  arrangement: state.arrangement ?? []
});

const normalizeState = (state) => {
  const bpm = clamp(state.bpm ?? DEFAULT_BPM, 30, 260);
  const rows = ensurePositiveInteger(state.rows, DEFAULT_ROWS, 1, 32);
  // Coerce stepsPerBar to valid values (8, 16, 32, 64) for proper 4/4 time alignment
  const stepsPerBar = coerceStepsPerBar(state.stepsPerBar ?? DEFAULT_STEPS_PER_BAR);
  const desiredBars = ensurePositiveInteger(state.bars, DEFAULT_BARS, 2, 512);
  const bars = ensureBarsWithinLimit(bpm, desiredBars);
  // internal storage uses BASE_RESOLUTION per bar
  const storageSteps = bars * BASE_RESOLUTION;
  
  // Support both legacy single-track model and new pattern-based model
  let tracks, patterns, selectedPattern;
  
  if (state.patterns && Array.isArray(state.patterns) && state.patterns.length > 0) {
    // Pattern-based model - pass bars from state to synchronize pattern storage
    patterns = normalizePatterns(state.patterns, rows, bpm, bars);
    selectedPattern = clamp(state.selectedPattern ?? 0, 0, Math.max(patterns.length - 1, 0));
    // Use current pattern's tracks
    tracks = patterns[selectedPattern].tracks;
  } else {
    // Legacy single-track model (backwards compatibility)
    tracks = normalizeTracks(state.tracks, rows, storageSteps);
    patterns = [createPattern('A', 'Pattern A', bars, rows, storageSteps, tracks)];
    selectedPattern = 0;
  }
  
  const selectedTrack = clamp(state.selectedTrack ?? 0, 0, Math.max(tracks.length - 1, 0));
  const playheadStepValue = Number.isFinite(state.playheadStep) ? state.playheadStep : 0;
  const playheadProgressValue = Number.isFinite(state.playheadProgress) ? state.playheadProgress : 0;
  const lastStepTimeValue = Number.isFinite(state.lastStepTime) ? state.lastStepTime : 0;
  const nextStepTimeValue = Number.isFinite(state.nextStepTime) ? state.nextStepTime : 0;
  
  return {
    name: sanitizeName(state.name ?? DEFAULT_NAME),
    rows,
    bars,
    stepsPerBar,
    bpm,
    follow: state.follow ?? DEFAULT_FOLLOW,
    playing: state.playing ?? false,
    selectedTrack,
    // normalize playhead to within the logical total steps (bars * stepsPerBar)
    playheadStep: playheadStepValue % Math.max(1, bars * stepsPerBar),
    playheadProgress: clamp(playheadProgressValue, 0, 1),
    lastStepTime: lastStepTimeValue,
    nextStepTime: nextStepTimeValue,
    tracks,
    patterns,
    selectedPattern,
    arrangement: state.arrangement ?? []
  };
};

const initialState = normalizeState({
  name: DEFAULT_NAME,
  rows: DEFAULT_ROWS,
  bars: DEFAULT_BARS,
  stepsPerBar: DEFAULT_STEPS_PER_BAR,
  bpm: DEFAULT_BPM,
  follow: DEFAULT_FOLLOW,
  playing: false,
  selectedTrack: 0,
  playheadStep: 0,
  playheadProgress: 0,
  lastStepTime: 0,
  nextStepTime: 0,
  tracks: [
    createTrack(0, DEFAULT_ROWS, DEFAULT_BARS * BASE_RESOLUTION)
  ]
});

const snapshotSignature = (snapshot) => JSON.stringify(snapshot);

// Grid-specific history for note changes only
const gridHistoryStatusStore = writable({ canUndo: false, canRedo: false });

// Helper to create a snapshot of only the grid/note data
const toGridSnapshot = (state) => ({
  tracks: snapshotTracks(state.tracks)
});

const gridSnapshotSignature = (snapshot) => JSON.stringify(snapshot);

const historyStatusStore = writable({ canUndo: false, canRedo: false });

const createProjectStore = () => {
  const store = writable(initialState);
  const { subscribe, set, update } = store;

  let historyPast = [];
  let historyFuture = [];
  let suppressHistory = false;

  // Grid-specific history (only tracks note changes)
  let gridHistoryPast = [];
  let gridHistoryFuture = [];
  let suppressGridHistory = false;

  const updateHistoryStatus = () => {
    historyStatusStore.set({ canUndo: historyPast.length > 0, canRedo: historyFuture.length > 0 });
  };

  const updateGridHistoryStatus = () => {
    gridHistoryStatusStore.set({ canUndo: gridHistoryPast.length > 0, canRedo: gridHistoryFuture.length > 0 });
  };

  const pushHistory = (snapshot) => {
    if (suppressHistory) return;
    historyPast = [...historyPast, snapshot].slice(-MAX_HISTORY);
    historyFuture = [];
    updateHistoryStatus();
  };

  const pushGridHistory = (gridSnapshot) => {
    if (suppressGridHistory) return;
    gridHistoryPast = [...gridHistoryPast, gridSnapshot].slice(-MAX_HISTORY);
    gridHistoryFuture = [];
    updateGridHistoryStatus();
  };

  const applySnapshot = (snapshot) => {
    suppressHistory = true;
    set(normalizeState({ ...snapshot, playing: false, follow: snapshot.follow ?? DEFAULT_FOLLOW }));
    suppressHistory = false;
    updateHistoryStatus();
  };

  const applyGridSnapshot = (gridSnapshot) => {
    suppressGridHistory = true;
    update((state) => {
      // Only update tracks/notes, preserve all other state
      const tracks = gridSnapshot.tracks.map((track, index) => ({
        ...state.tracks[index],
        notes: track.notes.map(row => [...row])
      }));
      
      // Update patterns if they exist
      if (state.patterns && Array.isArray(state.patterns)) {
        const patterns = state.patterns.map((pattern, idx) => {
          if (idx !== state.selectedPattern) return pattern;
          return { ...pattern, tracks };
        });
        return { ...state, tracks, patterns };
      }
      
      return { ...state, tracks };
    });
    suppressGridHistory = false;
    updateGridHistoryStatus();
  };

  const applyNoteRange = (trackIndex, row, start, length, value) => {
    const prevSnapshot = toSnapshot(get(store));
    const prevGridSnapshot = toGridSnapshot(get(store));
    let changed = false;
    update((state) => {
      const totalLogicalSteps = state.bars * state.stepsPerBar;
      const storageSteps = state.bars * BASE_RESOLUTION;
      if (
        trackIndex < 0 ||
        trackIndex >= state.tracks.length ||
        row < 0 ||
        row >= state.rows ||
        totalLogicalSteps <= 0
      ) {
        return state;
      }
      const safeStart = clamp(start ?? 0, 0, Math.max(totalLogicalSteps - 1, 0));
      const rawLength = Number.isFinite(length) ? Math.round(length) : 1;
      const clampedLength = Math.max(1, Math.min(Math.abs(rawLength) || 1, totalLogicalSteps - safeStart));
      const track = state.tracks[trackIndex];
      const rowNotes = track.notes?.[row] ?? [];

      // Map logical indices -> storage indices
      const storagePerLogical = BASE_RESOLUTION / Math.max(1, state.stepsPerBar);
      const storageStart = Math.floor(safeStart * storagePerLogical);
      const storageLength = Math.max(1, Math.round(clampedLength * storagePerLogical));
      const sliceEnd = storageStart + storageLength;
      const currentSlice = rowNotes.slice(storageStart, sliceEnd);
      let nextValue = value;
      if (nextValue === undefined) {
        // Use some() to detect if ANY part of the slice has notes
        // This ensures proper toggle behavior when notes were placed at different resolutions
        const anyActive = currentSlice.length > 0 && currentSlice.some(Boolean);
        nextValue = !anyActive;
      }

      const desiredValue = !!nextValue;
      const noChange =
        currentSlice.length === storageLength &&
        currentSlice.every((cell) => cell === desiredValue);

      if (noChange) {
        return state;
      }

      const tracks = state.tracks.map((t, idx) => {
        if (idx !== trackIndex) return t;
          const notes = t.notes.map((rowNotes, rowIdx) => {
          if (rowIdx !== row) return rowNotes.slice();
          const rowCopy = rowNotes.slice();
          for (let offset = 0; offset < storageLength; offset += 1) {
            const targetIndex = storageStart + offset;
            if (targetIndex < rowCopy.length) {
              rowCopy[targetIndex] = desiredValue;
            }
          }
          return rowCopy;
        });
        return { ...t, notes };
      });

      changed = true;
      
      // Update patterns if they exist
      if (state.patterns && Array.isArray(state.patterns)) {
        const patterns = state.patterns.map((pattern, idx) => {
          if (idx !== state.selectedPattern) return pattern;
          return { ...pattern, tracks };
        });
        return { ...state, tracks, patterns };
      }
      
      return { ...state, tracks };
    });

    if (changed) {
      const nextSnapshot = toSnapshot(get(store));
      const nextGridSnapshot = toGridSnapshot(get(store));
      if (snapshotSignature(prevSnapshot) !== snapshotSignature(nextSnapshot)) {
        pushHistory(prevSnapshot);
      }
      // Also track grid-specific history for note changes
      if (gridSnapshotSignature(prevGridSnapshot) !== gridSnapshotSignature(nextGridSnapshot)) {
        pushGridHistory(prevGridSnapshot);
      }
    }
  };

  // Apply a note range where the provided start/length are already in
  // storage (high-resolution) indices (0..bars*BASE_RESOLUTION-1).
  const applyNoteRangeStorage = (trackIndex, row, storageStart, storageLength, value) => {
    const prevSnapshot = toSnapshot(get(store));
    const prevGridSnapshot = toGridSnapshot(get(store));
    let changed = false;
    update((state) => {
      const storageSteps = state.bars * BASE_RESOLUTION;
      if (
        trackIndex < 0 ||
        trackIndex >= state.tracks.length ||
        row < 0 ||
        row >= state.rows ||
        storageSteps <= 0
      ) {
        return state;
      }

      const safeStart = clamp(Math.floor(storageStart ?? 0), 0, Math.max(storageSteps - 1, 0));
      const rawLength = Number.isFinite(storageLength) ? Math.round(storageLength) : 1;
      const clampedLength = Math.max(1, Math.min(Math.abs(rawLength) || 1, storageSteps - safeStart));

      const track = state.tracks[trackIndex];
      const rowNotes = track.notes?.[row] ?? [];

      const sliceEnd = safeStart + clampedLength;
      const currentSlice = rowNotes.slice(safeStart, sliceEnd);
      let nextValue = value;
      if (nextValue === undefined) {
        // Use some() to detect if ANY part of the slice has notes
        // This ensures proper toggle behavior when notes were placed at different resolutions
        const anyActive = currentSlice.length > 0 && currentSlice.some(Boolean);
        nextValue = !anyActive;
      }

      const desiredValue = !!nextValue;
      const noChange =
        currentSlice.length === clampedLength &&
        currentSlice.every((cell) => cell === desiredValue);

      if (noChange) {
        return state;
      }

      const tracks = state.tracks.map((t, idx) => {
        if (idx !== trackIndex) return t;
        const notes = t.notes.map((rowNotes, rowIdx) => {
          if (rowIdx !== row) return rowNotes.slice();
          const rowCopy = rowNotes.slice();
          for (let offset = 0; offset < clampedLength; offset += 1) {
            const targetIndex = safeStart + offset;
            if (targetIndex < rowCopy.length) {
              rowCopy[targetIndex] = desiredValue;
            }
          }
          return rowCopy;
        });
        return { ...t, notes };
      });

      changed = true;
      
      // Update patterns if they exist
      if (state.patterns && Array.isArray(state.patterns)) {
        const patterns = state.patterns.map((pattern, idx) => {
          if (idx !== state.selectedPattern) return pattern;
          return { ...pattern, tracks };
        });
        return { ...state, tracks, patterns };
      }
      
      return { ...state, tracks };
    });

    if (changed) {
      const nextSnapshot = toSnapshot(get(store));
      const nextGridSnapshot = toGridSnapshot(get(store));
      if (snapshotSignature(prevSnapshot) !== snapshotSignature(nextSnapshot)) {
        pushHistory(prevSnapshot);
      }
      // Also track grid-specific history for note changes
      if (gridSnapshotSignature(prevGridSnapshot) !== gridSnapshotSignature(nextGridSnapshot)) {
        pushGridHistory(prevGridSnapshot);
      }
    }
  };

  return {
    subscribe,
    historyStatus: { subscribe: historyStatusStore.subscribe },
    toggleNote(trackIndex, row, step, value) {
      applyNoteRange(trackIndex, row, step, 1, value);
    },
    setNoteRange(trackIndex, row, start, length, value) {
      applyNoteRange(trackIndex, row, start, length, value);
    },
    setNoteRangeStorage(trackIndex, row, storageStart, storageLength, value) {
      applyNoteRangeStorage(trackIndex, row, storageStart, storageLength, value);
    },
    setPlaying(playing) {
      update((state) => ({ ...state, playing }));
    },
    setFollow(follow) {
      update((state) => ({ ...state, follow }));
    },
    selectTrack(index) {
      update((state) => ({ ...state, selectedTrack: clamp(index, 0, Math.max(state.tracks.length - 1, 0)) }));
    },
    setBpm(value) {
      const prevSnapshot = toSnapshot(get(store));
      update((state) => {
        const bpm = clamp(value, 30, 260);
        const bars = ensureBarsWithinLimit(bpm, state.bars);
        return normalizeState({ ...state, bpm, bars });
      });
      const nextSnapshot = toSnapshot(get(store));
      if (snapshotSignature(prevSnapshot) !== snapshotSignature(nextSnapshot)) {
        pushHistory(prevSnapshot);
      }
    },
    setBars(value) {
      const prevSnapshot = toSnapshot(get(store));
      update((state) => {
        const bars = ensureBarsWithinLimit(state.bpm, ensurePositiveInteger(value, state.bars, 2, 512));
        return normalizeState({ ...state, bars });
      });
      const nextSnapshot = toSnapshot(get(store));
      if (snapshotSignature(prevSnapshot) !== snapshotSignature(nextSnapshot)) {
        pushHistory(prevSnapshot);
      }
    },
    setStepsPerBar(value) {
      const prevSnapshot = toSnapshot(get(store));
      update((state) => {
        // Coerce to valid values (8, 16, 32, 64) for proper 4/4 time alignment
        const stepsPerBar = coerceStepsPerBar(value);
        return normalizeState({ ...state, stepsPerBar });
      });
      const nextSnapshot = toSnapshot(get(store));
      if (snapshotSignature(prevSnapshot) !== snapshotSignature(nextSnapshot)) {
        pushHistory(prevSnapshot);
      }
    },
    setTrackSetting(trackIndex, key, value) {
      const prevSnapshot = toSnapshot(get(store));
      let changed = false;
      update((state) => {
        if (trackIndex < 0 || trackIndex >= state.tracks.length) return state;
        const nextTracks = state.tracks.map((track, idx) => {
          if (idx !== trackIndex) return track;
          if (key === 'volume') {
            const volume = clamp(value, 0, 1);
            if (volume === track.volume) return track;
            changed = true;
            return { ...track, volume };
          }
          if (key === 'octave') {
            const octave = clamp(value, 1, 7);
            if (octave === track.octave) return track;
            changed = true;
            return { ...track, octave };
          }
          if (key === 'customShape') {
            const customShape = sanitizeCustomShape(value);
            if (customShape === track.customShape) return track;
            changed = true;
            return { ...track, customShape };
          }
          if (key === 'effects') {
            const nextEffects = sanitizeEffects({ ...track.effects, ...(value || {}) });
            const same =
              nextEffects.filterType === track.effects.filterType &&
              nextEffects.filterCutoff === track.effects.filterCutoff &&
              nextEffects.filterQ === track.effects.filterQ &&
              nextEffects.delayMix === track.effects.delayMix &&
              nextEffects.delayTime === track.effects.delayTime &&
              nextEffects.delayFeedback === track.effects.delayFeedback &&
              nextEffects.reverbMix === track.effects.reverbMix &&
              nextEffects.reverbTime === track.effects.reverbTime &&
              nextEffects.bitcrushBits === track.effects.bitcrushBits &&
              nextEffects.bitcrushRate === track.effects.bitcrushRate;
            if (same) return track;
            changed = true;
            return { ...track, effects: nextEffects };
          }
          if (key === 'adsr') {
            const nextAdsr = sanitizeAdsr({ ...track.adsr, ...(value || {}) });
            const same =
              nextAdsr.attack === track.adsr.attack &&
              nextAdsr.decay === track.adsr.decay &&
              nextAdsr.sustain === track.adsr.sustain &&
              nextAdsr.release === track.adsr.release;
            if (same) return track;
            changed = true;
            return { ...track, adsr: nextAdsr };
          }
          if (key === 'mute' || key === 'solo') {
            const next = !!value;
            if (track[key] === next) return track;
            changed = true;
            return { ...track, [key]: next };
          }
          if (key === 'scale') {
            if (!scales[value] || value === track.scale) return track;
            changed = true;
            return { ...track, scale: value };
          }
          if (key === 'name') {
            const name = sanitizeName(value ?? track.name);
            if (name === track.name) return track;
            changed = true;
            return { ...track, name };
          }
          if (key === 'color') {
            const color = value || track.color;
            if (color === track.color) return track;
            changed = true;
            return { ...track, color };
          }
          if (track[key] === value) return track;
          changed = true;
          return { ...track, [key]: value };
        });
        let tracks = nextTracks;
        if (key === 'solo' && value) {
          tracks = nextTracks.map((track, idx) => (idx === trackIndex ? track : { ...track, solo: false }));
        }
        return { ...state, tracks };
      });
      if (changed) {
        const nextSnapshot = toSnapshot(get(store));
        if (snapshotSignature(prevSnapshot) !== snapshotSignature(nextSnapshot)) {
          pushHistory(prevSnapshot);
        }
      }
    },
    setAllTracksScale(scaleName) {
      if (!scales[scaleName]) return;
      const prevSnapshot = toSnapshot(get(store));
      let changed = false;
      update((state) => {
        const nextTracks = state.tracks.map((track) => {
          if (track.scale === scaleName) return track;
          changed = true;
          return { ...track, scale: scaleName };
        });
        return { ...state, tracks: nextTracks };
      });
      if (changed) {
        const nextSnapshot = toSnapshot(get(store));
        if (snapshotSignature(prevSnapshot) !== snapshotSignature(nextSnapshot)) {
          pushHistory(prevSnapshot);
        }
      }
    },
    setAllTracksRootNote(rootNote) {
      const numericNote = clamp(Number(rootNote), 0, 11);
      const prevSnapshot = toSnapshot(get(store));
      let changed = false;
      update((state) => {
        const nextTracks = state.tracks.map((track) => {
          if (track.rootNote === numericNote) return track;
          changed = true;
          return { ...track, rootNote: numericNote };
        });
        return { ...state, tracks: nextTracks };
      });
      if (changed) {
        const nextSnapshot = toSnapshot(get(store));
        if (snapshotSignature(prevSnapshot) !== snapshotSignature(nextSnapshot)) {
          pushHistory(prevSnapshot);
        }
      }
    },
    addTrack() {
      const prevSnapshot = toSnapshot(get(store));
      let changed = false;
      update((state) => {
        if (state.tracks.length >= MAX_TRACKS) return state;
        const storageSteps = state.bars * BASE_RESOLUTION;
        const tracks = [...state.tracks, createTrack(state.tracks.length, state.rows, storageSteps)];
        changed = true;
        
        // Update patterns if they exist
        if (state.patterns && Array.isArray(state.patterns)) {
          const patterns = state.patterns.map((pattern, idx) => {
            if (idx !== state.selectedPattern) return pattern;
            return { ...pattern, tracks };
          });
          return normalizeState({ ...state, tracks, patterns, selectedTrack: tracks.length - 1 });
        }
        
        return normalizeState({ ...state, tracks, selectedTrack: tracks.length - 1 });
      });
      if (changed) {
        pushHistory(prevSnapshot);
      }
    },
    duplicateTrack(index) {
      const prevSnapshot = toSnapshot(get(store));
      let changed = false;
      update((state) => {
        if (state.tracks.length >= MAX_TRACKS) return state;
        if (index < 0 || index >= state.tracks.length) return state;
        const trackToDuplicate = state.tracks[index];
        const duplicatedTrack = {
          ...trackToDuplicate,
          name: `${trackToDuplicate.name} Copy`,
          notes: trackToDuplicate.notes.map(row => [...row])
        };
        const tracks = [...state.tracks, duplicatedTrack];
        changed = true;
        
        // Update patterns if they exist
        if (state.patterns && Array.isArray(state.patterns)) {
          const patterns = state.patterns.map((pattern, idx) => {
            if (idx !== state.selectedPattern) return pattern;
            return { ...pattern, tracks };
          });
          return normalizeState({ ...state, tracks, patterns, selectedTrack: tracks.length - 1 });
        }
        
        return normalizeState({ ...state, tracks, selectedTrack: tracks.length - 1 });
      });
      if (changed) {
        pushHistory(prevSnapshot);
      }
    },
    removeTrack(index) {
      const prevSnapshot = toSnapshot(get(store));
      let changed = false;
      update((state) => {
        if (state.tracks.length <= 1) return state;
        if (index < 0 || index >= state.tracks.length) return state;
        const tracks = state.tracks.filter((_, idx) => idx !== index);
        changed = true;
        const selectedTrack = clamp(state.selectedTrack >= index ? state.selectedTrack - 1 : state.selectedTrack, 0, tracks.length - 1);
        
        // Update patterns if they exist
        if (state.patterns && Array.isArray(state.patterns)) {
          const patterns = state.patterns.map((pattern, idx) => {
            if (idx !== state.selectedPattern) return pattern;
            return { ...pattern, tracks };
          });
          return normalizeState({ ...state, tracks, patterns, selectedTrack });
        }
        
        return normalizeState({ ...state, tracks, selectedTrack });
      });
      if (changed) {
        pushHistory(prevSnapshot);
      }
    },
    registerStep(step, stepTime, stepDuration) {
      update((state) => ({
        ...state,
        playheadStep: step,
        playheadProgress: 0,
        lastStepTime: stepTime,
        nextStepTime: stepTime + stepDuration
      }));
    },
    setPlayheadProgress(progress) {
      update((state) => ({ ...state, playheadProgress: clamp(progress, 0, 1) }));
    },
    resetPlayhead() {
      update((state) => ({ ...state, playheadStep: 0, playheadProgress: 0, lastStepTime: 0, nextStepTime: 0 }));
    },
    undo() {
      if (!historyPast.length) return false;
      const currentSnapshot = toSnapshot(get(store));
      const previous = historyPast.pop();
      historyFuture = [currentSnapshot, ...historyFuture].slice(0, MAX_HISTORY);
      applySnapshot(previous);
      updateHistoryStatus();
      return true;
    },
    redo() {
      if (!historyFuture.length) return false;
      const currentSnapshot = toSnapshot(get(store));
      const nextSnapshot = historyFuture.shift();
      historyPast = [...historyPast, currentSnapshot].slice(-MAX_HISTORY);
      applySnapshot(nextSnapshot);
      updateHistoryStatus();
      return true;
    },
    // Grid-specific undo/redo (only affects notes/grid changes)
    gridUndo() {
      if (!gridHistoryPast.length) return false;
      const currentGridSnapshot = toGridSnapshot(get(store));
      const previous = gridHistoryPast.pop();
      gridHistoryFuture = [currentGridSnapshot, ...gridHistoryFuture].slice(0, MAX_HISTORY);
      applyGridSnapshot(previous);
      updateGridHistoryStatus();
      return true;
    },
    gridRedo() {
      if (!gridHistoryFuture.length) return false;
      const currentGridSnapshot = toGridSnapshot(get(store));
      const nextSnapshot = gridHistoryFuture.shift();
      gridHistoryPast = [...gridHistoryPast, currentGridSnapshot].slice(-MAX_HISTORY);
      applyGridSnapshot(nextSnapshot);
      updateGridHistoryStatus();
      return true;
    },
    canUndo() {
      return historyPast.length > 0;
    },
    canRedo() {
      return historyFuture.length > 0;
    },
    toSnapshot() {
      return toSnapshot(get(store));
    },
    defaultSnapshot() {
      return toSnapshot(initialState);
    },
    serialize() {
      return this.toSnapshot();
    },
    getName() {
      return get(store).name;
    },
    setName(name) {
      const prevSnapshot = toSnapshot(get(store));
      update((state) => ({ ...state, name: sanitizeName(name) }));
      const nextSnapshot = toSnapshot(get(store));
      if (snapshotSignature(prevSnapshot) !== snapshotSignature(nextSnapshot)) {
        pushHistory(prevSnapshot);
      }
    },
    load(payload) {
      if (!payload || typeof payload !== 'object') return false;
      const rows = ensurePositiveInteger(payload.rows, DEFAULT_ROWS, 1, 32);
      const bpm = clamp(payload.bpm ?? DEFAULT_BPM, 30, 260);
      const maxBars = calculateMaxBars(bpm);
      const bars = clamp(payload.bars ?? DEFAULT_BARS, 1, maxBars);
      // Coerce stepsPerBar to valid values (8, 16, 32, 64) for proper 4/4 time alignment
      const stepsPerBar = coerceStepsPerBar(payload.stepsPerBar ?? DEFAULT_STEPS_PER_BAR);
      const tracksPayload = Array.isArray(payload.tracks) && payload.tracks.length > 0 ? payload.tracks : undefined;
      const patternsPayload = Array.isArray(payload.patterns) && payload.patterns.length > 0 ? payload.patterns : undefined;
      
      const snapshot = {
        name: sanitizeName(payload.name ?? DEFAULT_NAME),
        rows,
        bars,
        stepsPerBar,
        bpm,
        follow: payload.follow ?? DEFAULT_FOLLOW,
        playing: false,
        selectedTrack: clamp(payload.selectedTrack ?? 0, 0, Math.max((tracksPayload?.length ?? 1) - 1, 0)),
        playheadStep: 0,
        playheadProgress: 0,
        lastStepTime: 0,
        nextStepTime: 0,
        tracks: tracksPayload ?? [createTrack(0, rows, bars * BASE_RESOLUTION)],
        patterns: patternsPayload,
        selectedPattern: payload.selectedPattern ?? 0,
        arrangement: payload.arrangement ?? []
      };
      suppressHistory = true;
      set(normalizeState(snapshot));
      suppressHistory = false;
      historyPast = [];
      historyFuture = [];
      // Also reset grid-specific history
      gridHistoryPast = [];
      gridHistoryFuture = [];
      updateHistoryStatus();
      updateGridHistoryStatus();
      return true;
    },
    // Pattern management functions
    selectPattern(index) {
      const prevSnapshot = toSnapshot(get(store));
      update((state) => {
        const safeIndex = clamp(index, 0, Math.max(state.patterns.length - 1, 0));
        const pattern = state.patterns[safeIndex];
        return normalizeState({ 
          ...state, 
          selectedPattern: safeIndex,
          tracks: pattern.tracks,
          bars: pattern.bars
        });
      });
      const nextSnapshot = toSnapshot(get(store));
      if (snapshotSignature(prevSnapshot) !== snapshotSignature(nextSnapshot)) {
        pushHistory(prevSnapshot);
      }
    },
    addPattern() {
      const prevSnapshot = toSnapshot(get(store));
      update((state) => {
        const newId = `pattern-${Date.now()}`;
        const newName = `Pattern ${String.fromCharCode(65 + state.patterns.length)}`;
        const storageSteps = state.bars * BASE_RESOLUTION;
        const newPattern = createPattern(newId, newName, state.bars, state.rows, storageSteps);
        const patterns = [...state.patterns, newPattern];
        return normalizeState({ 
          ...state, 
          patterns,
          selectedPattern: patterns.length - 1,
          tracks: newPattern.tracks,
          bars: newPattern.bars
        });
      });
      pushHistory(prevSnapshot);
    },
    duplicatePattern(index) {
      const prevSnapshot = toSnapshot(get(store));
      update((state) => {
        if (index < 0 || index >= state.patterns.length) return state;
        const patternToDup = state.patterns[index];
        const newId = `pattern-${Date.now()}`;
        const newName = `${patternToDup.name} Copy`;
        const dupPattern = {
          ...patternToDup,
          id: newId,
          name: newName,
          tracks: patternToDup.tracks.map(track => ({
            ...track,
            notes: track.notes.map(row => [...row])
          }))
        };
        const patterns = [...state.patterns, dupPattern];
        return normalizeState({ 
          ...state, 
          patterns,
          selectedPattern: patterns.length - 1,
          tracks: dupPattern.tracks,
          bars: dupPattern.bars
        });
      });
      pushHistory(prevSnapshot);
    },
    removePattern(index) {
      const prevSnapshot = toSnapshot(get(store));
      update((state) => {
        if (state.patterns.length <= 1) return state;
        if (index < 0 || index >= state.patterns.length) return state;
        const patterns = state.patterns.filter((_, idx) => idx !== index);
        const selectedPattern = clamp(
          state.selectedPattern >= index ? state.selectedPattern - 1 : state.selectedPattern,
          0,
          patterns.length - 1
        );
        const pattern = patterns[selectedPattern];
        return normalizeState({ 
          ...state, 
          patterns,
          selectedPattern,
          tracks: pattern.tracks,
          bars: pattern.bars
        });
      });
      pushHistory(prevSnapshot);
    },
    renamePattern(index, name) {
      const prevSnapshot = toSnapshot(get(store));
      update((state) => {
        if (index < 0 || index >= state.patterns.length) return state;
        const patterns = state.patterns.map((p, idx) => 
          idx === index ? { ...p, name: sanitizeName(name) } : p
        );
        return normalizeState({ ...state, patterns });
      });
      const nextSnapshot = toSnapshot(get(store));
      if (snapshotSignature(prevSnapshot) !== snapshotSignature(nextSnapshot)) {
        pushHistory(prevSnapshot);
      }
    },
    reorderPattern(fromIndex, toIndex) {
      const prevSnapshot = toSnapshot(get(store));
      let didChange = false;
      update((state) => {
        if (fromIndex < 0 || fromIndex >= state.patterns.length) return state;
        if (toIndex < 0 || toIndex >= state.patterns.length) return state;
        if (fromIndex === toIndex) return state;

        didChange = true;
        const patterns = [...state.patterns];
        const [movedPattern] = patterns.splice(fromIndex, 1);
        patterns.splice(toIndex, 0, movedPattern);

        // Update selectedPattern to follow the pattern that was selected
        let newSelectedPattern = state.selectedPattern;
        if (state.selectedPattern === fromIndex) {
          newSelectedPattern = toIndex;
        } else if (fromIndex < state.selectedPattern && toIndex >= state.selectedPattern) {
          newSelectedPattern = state.selectedPattern - 1;
        } else if (fromIndex > state.selectedPattern && toIndex <= state.selectedPattern) {
          newSelectedPattern = state.selectedPattern + 1;
        }

        return normalizeState({ ...state, patterns, selectedPattern: newSelectedPattern });
      });
      if (didChange) {
        pushHistory(prevSnapshot);
      }
    }
  };
};

export const TRACK_LIMIT = MAX_TRACKS;
export const DEFAULT_STEPS_PER_BAR_VALUE = DEFAULT_STEPS_PER_BAR;

export const project = createProjectStore();
export const historyStatus = historyStatusStore;
export const gridHistoryStatus = gridHistoryStatusStore;

export const totalSteps = derived(project, ($project) => $project.bars * $project.stepsPerBar);
export const loopDuration = derived(project, ($project) => ($project.bars * 240) / $project.bpm);
export const maxBars = derived(project, ($project) => calculateMaxBars($project.bpm));

