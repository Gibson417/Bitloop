import { writable, derived, get } from 'svelte/store';
import { scales } from '../lib/scales.js';

export const MAX_LOOP_SECONDS = 300;

const DEFAULT_ROWS = 8;
const DEFAULT_BARS = 4;
const DEFAULT_STEPS_PER_BAR = 16;
const DEFAULT_BPM = 120;
const DEFAULT_FOLLOW = true;
const TRACK_COLORS = ['#78D2B9', '#A88EF6', '#F6C58E', '#F68EAF', '#8EF6D1'];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const createEmptyPattern = (rows, steps) =>
  Array.from({ length: rows }, () => Array.from({ length: steps }, () => false));

const resizeTrack = (track, rows, steps) => {
  const notes = Array.from({ length: rows }, (_, rowIndex) => {
    const row = track.notes?.[rowIndex] ?? [];
    const padded = row.slice(0, steps);
    if (padded.length < steps) {
      padded.push(...Array.from({ length: steps - padded.length }, () => false));
    }
    return padded;
  });
  return { ...track, notes };
};

const normalizeTracks = (tracks, rows, steps) =>
  tracks.map((track, index) => {
    const color = track.color ?? TRACK_COLORS[index % TRACK_COLORS.length];
    const waveform = track.waveform ?? 'square';
    const scaleName = scales[track.scale] ? track.scale : 'major';
    const octave = clamp(track.octave ?? 4, 1, 7);
    const volume = clamp(track.volume ?? 0.7, 0, 1);
    return resizeTrack(
      {
        id: track.id ?? index + 1,
        name: track.name ?? `Track ${index + 1}`,
        color,
        waveform,
        scale: scaleName,
        octave,
        volume,
        mute: !!track.mute,
        solo: !!track.solo,
        notes: track.notes ?? createEmptyPattern(DEFAULT_ROWS, DEFAULT_STEPS_PER_BAR * DEFAULT_BARS)
      },
      rows,
      steps
    );
  });

const createTrack = (index, rows, steps) =>
  resizeTrack(
    {
      id: index + 1,
      name: `Track ${index + 1}`,
      color: TRACK_COLORS[index % TRACK_COLORS.length],
      waveform: 'square',
      scale: 'major',
      octave: 4,
      volume: 0.7,
      mute: false,
      solo: false,
      notes: createEmptyPattern(rows, steps)
    },
    rows,
    steps
  );

const calculateSecondsPerBar = (bpm) => (240 / bpm);

const calculateMaxBars = (bpm) => {
  const secondsPerBar = calculateSecondsPerBar(bpm);
  return Math.max(1, Math.floor(MAX_LOOP_SECONDS / secondsPerBar));
};

const normalizeState = (state) => {
  const steps = state.bars * state.stepsPerBar;
  const rows = state.rows;
  const tracks = normalizeTracks(state.tracks, rows, steps);
  const selectedTrack = clamp(state.selectedTrack ?? 0, 0, Math.max(tracks.length - 1, 0));
  const playheadStep = state.playheadStep % (steps || 1);
  return {
    rows,
    bars: state.bars,
    stepsPerBar: state.stepsPerBar,
    bpm: state.bpm,
    follow: state.follow,
    playing: state.playing,
    selectedTrack,
    playheadStep,
    playheadProgress: state.playheadProgress ?? 0,
    lastStepTime: state.lastStepTime ?? 0,
    nextStepTime: state.nextStepTime ?? 0,
    tracks
  };
};

const initialState = normalizeState({
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
  tracks: [createTrack(0, DEFAULT_ROWS, DEFAULT_BARS * DEFAULT_STEPS_PER_BAR), createTrack(1, DEFAULT_ROWS, DEFAULT_BARS * DEFAULT_STEPS_PER_BAR)]
});

const ensureBarsWithinLimit = (bpm, desiredBars) => {
  const maxBars = calculateMaxBars(bpm);
  return Math.min(desiredBars, maxBars);
};

const ensurePositiveInteger = (value, fallback, min = 1, max = Number.POSITIVE_INFINITY) => {
  const parsed = Number.isFinite(value) ? value : parseInt(value, 10);
  if (Number.isFinite(parsed)) {
    return clamp(Math.round(parsed), min, max);
  }
  return clamp(fallback, min, max);
};

const createProjectStore = () => {
  const store = writable(initialState);
  const { subscribe, set, update } = store;

  return {
    subscribe,
    toggleNote(trackIndex, row, step, value) {
      update((state) => {
        const totalSteps = state.bars * state.stepsPerBar;
        if (
          trackIndex < 0 ||
          trackIndex >= state.tracks.length ||
          row < 0 ||
          row >= state.rows ||
          step < 0 ||
          step >= totalSteps
        ) {
          return state;
        }
        const tracks = state.tracks.map((track, idx) => {
          if (idx !== trackIndex) return track;
          const notes = track.notes.map((rowNotes) => rowNotes.slice());
          notes[row][step] = value ?? !notes[row][step];
          return { ...track, notes };
        });
        return { ...state, tracks };
      });
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
      update((state) => {
        const bpm = clamp(value, 30, 260);
        const bars = ensureBarsWithinLimit(bpm, state.bars);
        const next = normalizeState({ ...state, bpm, bars });
        return next;
      });
    },
    setBars(value) {
      update((state) => {
        const bars = ensureBarsWithinLimit(state.bpm, ensurePositiveInteger(value, state.bars, 1, 512));
        const next = normalizeState({ ...state, bars });
        return next;
      });
    },
    setStepsPerBar(value) {
      update((state) => {
        const stepsPerBar = ensurePositiveInteger(value, state.stepsPerBar, 4, 64);
        const next = normalizeState({ ...state, stepsPerBar });
        return next;
      });
    },
    setTrackSetting(trackIndex, key, value) {
      update((state) => {
        if (trackIndex < 0 || trackIndex >= state.tracks.length) return state;
        const nextTracks = state.tracks.map((track, idx) => {
          if (idx !== trackIndex) return track;
          if (key === 'volume') {
            return { ...track, volume: clamp(value, 0, 1) };
          }
          if (key === 'octave') {
            return { ...track, octave: clamp(value, 1, 7) };
          }
          if (key === 'mute' || key === 'solo') {
            return { ...track, [key]: !!value };
          }
          if (key === 'scale' && !scales[value]) {
            return track;
          }
          return { ...track, [key]: value };
        });
        let tracks = nextTracks;
        if (key === 'solo' && value) {
          tracks = nextTracks.map((track, idx) =>
            idx === trackIndex ? track : { ...track, solo: false }
          );
        }
        return { ...state, tracks };
      });
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
    serialize() {
      const snapshot = get(store);
      return {
        version: 1,
        rows: snapshot.rows,
        bars: snapshot.bars,
        stepsPerBar: snapshot.stepsPerBar,
        bpm: snapshot.bpm,
        tracks: snapshot.tracks.map((track) => ({
          id: track.id,
          name: track.name,
          color: track.color,
          waveform: track.waveform,
          scale: track.scale,
          octave: track.octave,
          volume: track.volume,
          mute: track.mute,
          solo: track.solo,
          notes: track.notes
        }))
      };
    },
    load(payload) {
      if (!payload || typeof payload !== 'object') return false;
      const rows = ensurePositiveInteger(payload.rows, DEFAULT_ROWS, 1, 32);
      const bpm = clamp(payload.bpm ?? DEFAULT_BPM, 30, 260);
      const maxBars = calculateMaxBars(bpm);
      const bars = clamp(payload.bars ?? DEFAULT_BARS, 1, maxBars);
      const stepsPerBar = ensurePositiveInteger(payload.stepsPerBar, DEFAULT_STEPS_PER_BAR, 4, 64);
      const tracksPayload = Array.isArray(payload.tracks) && payload.tracks.length > 0 ? payload.tracks : undefined;
      const tracks = tracksPayload
        ? normalizeTracks(tracksPayload, rows, bars * stepsPerBar)
        : [createTrack(0, rows, bars * stepsPerBar)];
      set(
        normalizeState({
          rows,
          bars,
          stepsPerBar,
          bpm,
          follow: payload.follow ?? DEFAULT_FOLLOW,
          playing: false,
          selectedTrack: clamp(payload.selectedTrack ?? 0, 0, Math.max(tracks.length - 1, 0)),
          playheadStep: 0,
          playheadProgress: 0,
          lastStepTime: 0,
          nextStepTime: 0,
          tracks
        })
      );
      return true;
    }
  };
};

export const project = createProjectStore();

export const totalSteps = derived(project, ($project) => $project.bars * $project.stepsPerBar);
export const loopDuration = derived(project, ($project) => ($project.bars * 240) / $project.bpm);
export const maxBars = derived(project, ($project) => calculateMaxBars($project.bpm));
