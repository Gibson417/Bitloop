// Note name utilities for Bloops

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

/**
 * Convert a MIDI note number to a note name with octave
 * @param {number} midi - MIDI note number (0-127)
 * @returns {string} Note name with octave (e.g., "C4", "A♯3")
 */
export const midiToNoteName = (midi) => {
  if (!Number.isFinite(midi) || midi < 0 || midi > 127) {
    return '?';
  }
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
};

/**
 * Get note names for all rows in a track given the current settings
 * @param {object} track - Track object with scale, octave, rootNote
 * @param {number} rows - Number of rows in the grid
 * @param {object} scales - Scale definitions object
 * @returns {Array<string>} Array of note names for each row (top to bottom)
 */
export const getRowNoteNames = (track, rows, scales) => {
  if (!track || !rows || !scales) {
    return Array.from({ length: rows || 8 }, () => '?');
  }

  const scalePattern = scales[track.scale] ?? scales.major ?? [0, 2, 4, 5, 7, 9, 11];
  const degrees = scalePattern.length;
  const rootNote = track.rootNote ?? 0;
  
  const noteNames = [];
  
  // Process rows from top to bottom (reversed from bottom-up calculation)
  for (let row = 0; row < rows; row += 1) {
    const indexFromBottom = rows - 1 - row;
    const octaveOffset = Math.floor(indexFromBottom / degrees);
    const degree = scalePattern[indexFromBottom % degrees];
    const octave = track.octave + octaveOffset;
    const midi = 12 * (octave + 1) + degree + rootNote;
    const clampedMidi = Math.min(Math.max(midi, 21), 108);
    noteNames.push(midiToNoteName(clampedMidi));
  }
  
  return noteNames;
};
