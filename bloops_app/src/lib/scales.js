// Scale definitions for Bloops.

// Each array is a list of semitone offsets from the root note.
// For example, the minor pentatonic scale uses [0, 3, 5, 7, 10].

export const scales = {
  // Pentatonic scales
  minorPent: [0, 3, 5, 7, 10],
  majorPent: [0, 2, 4, 7, 9],
  
  // Diatonic modes
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  
  // Melodic minor scales
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
  
  // Other common scales
  blues: [0, 3, 5, 6, 7, 10],
  wholeTone: [0, 2, 4, 6, 8, 10],
  diminished: [0, 2, 3, 5, 6, 8, 9, 11],
  augmented: [0, 3, 4, 7, 8, 11],
  
  // World scales
  japanese: [0, 1, 5, 7, 8],
  arabic: [0, 1, 4, 5, 7, 8, 11],
  
  // Special
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

// Validate if a custom scale array is valid
export const isValidCustomScale = (scale) => {
  if (!Array.isArray(scale) || scale.length === 0) return false;
  if (!scale.includes(0)) return false; // Must include root note
  return scale.every(note => 
    Number.isInteger(note) && note >= 0 && note < 12
  );
};

// Parse a custom scale string (e.g., "0,2,4,5,7,9,11" or "0 2 4 5 7 9 11")
export const parseCustomScale = (input) => {
  if (!input || typeof input !== 'string') return null;
  
  const delimiter = input.includes(',') ? ',' : /\s+/;
  const notes = input
    .trim()
    .split(delimiter)
    .map(s => parseInt(s.trim(), 10))
    .filter(n => Number.isInteger(n) && n >= 0 && n < 12);
  
  // Remove duplicates and sort
  const unique = [...new Set(notes)].sort((a, b) => a - b);
  
  return isValidCustomScale(unique) ? unique : null;
};