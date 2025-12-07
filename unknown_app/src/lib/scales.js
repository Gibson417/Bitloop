// Scale definitions for UNKNOWN - optimized for video game music.

// Each array is a list of semitone offsets from the root note.
// Scales are selected for their effectiveness in chiptune and video game composition.

export const scales = {
  // Pentatonic scales - Perfect for catchy, memorable melodies
  minorPent: [0, 3, 5, 7, 10],           // Most common in games
  majorPent: [0, 2, 4, 7, 9],            // Upbeat, happy themes
  
  // Basic diatonic scales
  major: [0, 2, 4, 5, 7, 9, 11],         // Classic major scale
  minor: [0, 2, 3, 5, 7, 8, 10],         // Natural minor
  
  // Common modes for game music
  dorian: [0, 2, 3, 5, 7, 9, 10],        // Fantasy/medieval themes
  mixolydian: [0, 2, 4, 5, 7, 9, 10],    // Rock-influenced, upbeat
  phrygianDom: [0, 1, 4, 5, 7, 8, 10],   // Exotic/mysterious (Spanish Phrygian)
  
  // Dramatic scales for boss battles and tension
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11], // Classic dramatic sound
  hungarianMinor: [0, 2, 3, 6, 7, 8, 11], // Eastern European/intense
  
  // World/ethnic scales popular in games
  hirajoshi: [0, 2, 3, 7, 8],            // Japanese traditional
  inSen: [0, 1, 5, 7, 10],               // Japanese meditative
  
  // Experimental/atmospheric scales
  wholeTone: [0, 2, 4, 6, 8, 10],        // Sci-fi/dreamlike
  blues: [0, 3, 5, 6, 7, 10],            // Blues flavor
  
  // Full control
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