import { derived, writable } from 'svelte/store';

const createEmptyGrid = (rows, columns) =>
  Array.from({ length: rows }, () => Array.from({ length: columns }, () => false));

const defaultTracks = [
  { name: 'Track 1', color: '#78D2B9', scale: 'minorPent', octave: 4, waveform: 'square', volume: 0.8, muted: false, solo: false },
  { name: 'Track 2', color: '#A88EF6', scale: 'majorPent', octave: 4, waveform: 'triangle', volume: 0.8, muted: false, solo: false }
];

const initialConfig = {
  bpm: 120,
  bars: 4,
  stepsPerBar: 16,
  rows: 8,
  columns: 16
};

const createProjectStore = () => {
  const { rows, columns } = initialConfig;
  const initialState = {
    ...initialConfig,
    tracks: defaultTracks,
    selectedTrackIndex: 0,
    playing: false,
    follow: false,
    activeNotes: createEmptyGrid(rows, columns)
  };

  const { subscribe, update, set } = writable(initialState);

  return {
    subscribe,
    reset: () => {
      set({
        ...initialState,
        activeNotes: createEmptyGrid(initialState.rows, initialState.columns)
      });
    },
    toggleNote: (row, column) => {
      update((state) => {
        if (row < 0 || row >= state.rows || column < 0 || column >= state.columns) {
          return state;
        }

        const nextGrid = state.activeNotes.map((r, rIdx) =>
          rIdx === row
            ? r.map((value, cIdx) => (cIdx === column ? !value : value))
            : r.slice()
        );

        return { ...state, activeNotes: nextGrid };
      });
    },
    selectTrack: (index) => {
      update((state) => {
        const bounded = Math.max(0, Math.min(index, state.tracks.length - 1));
        return { ...state, selectedTrackIndex: bounded };
      });
    },
    togglePlay: () => {
      update((state) => ({ ...state, playing: !state.playing }));
    },
    toggleFollow: () => {
      update((state) => ({ ...state, follow: !state.follow }));
    },
    setTempo: (bpm) => {
      update((state) => ({ ...state, bpm }));
    },
    setBars: (bars) => {
      update((state) => ({ ...state, bars }));
    },
    setStepsPerBar: (stepsPerBar) => {
      update((state) => ({ ...state, stepsPerBar }));
    },
    updateTrack: (index, data) => {
      update((state) => {
        if (index < 0 || index >= state.tracks.length) {
          return state;
        }
        const tracks = state.tracks.map((track, idx) =>
          idx === index ? { ...track, ...data } : track
        );
        return { ...state, tracks };
      });
    }
  };
};

export const project = createProjectStore();

export const loopSeconds = derived(project, ($project) => {
  const { bpm, bars, stepsPerBar } = $project;
  return (60 / bpm) * (stepsPerBar / 4) * bars;
});
