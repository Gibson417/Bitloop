import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Grid from '../components/Grid.svelte';

const createNotes = (rows, cols) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));

const createNotesWithPattern = (rows, cols) => {
  const notes = createNotes(rows, cols);
  // Add a note in row 0, columns 0-3
  for (let i = 0; i < 4; i++) {
    notes[0][i] = true;
  }
  return notes;
};

describe('Grid ghost notes', () => {
  it('renders without ghost tracks', () => {
    const rows = 4;
    const columns = 16;
    const { container } = render(Grid, {
      props: {
        rows,
        columns,
        notes: createNotes(rows, columns),
        ghostTracks: [],
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        noteLengthDenominator: 16,
        zoomLevel: 16
      }
    });

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('renders with ghost tracks', () => {
    const rows = 4;
    const columns = 16;
    const ghostTracks = [
      {
        notes: createNotesWithPattern(rows, columns * 8),
        color: '#78D2B9'
      }
    ];

    const { container } = render(Grid, {
      props: {
        rows,
        columns,
        notes: createNotes(rows, columns * 8),
        ghostTracks,
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        noteLengthDenominator: 16,
        zoomLevel: 16
      }
    });

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('renders with multiple ghost tracks', () => {
    const rows = 4;
    const columns = 16;
    const ghostTracks = [
      {
        notes: createNotesWithPattern(rows, columns * 8),
        color: '#78D2B9'
      },
      {
        notes: createNotesWithPattern(rows, columns * 8),
        color: '#A88EF6'
      }
    ];

    const { container } = render(Grid, {
      props: {
        rows,
        columns,
        notes: createNotes(rows, columns * 8),
        ghostTracks,
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        noteLengthDenominator: 16,
        zoomLevel: 16
      }
    });

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('accepts empty ghost tracks array', () => {
    const rows = 4;
    const columns = 16;

    const { container } = render(Grid, {
      props: {
        rows,
        columns,
        notes: createNotes(rows, columns * 8),
        ghostTracks: [],
        playheadStep: 0,
        playheadProgress: 0,
        follow: false,
        isPlaying: false,
        noteLengthDenominator: 16,
        zoomLevel: 16
      }
    });

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });
});
