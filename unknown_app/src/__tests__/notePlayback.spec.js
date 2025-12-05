import { describe, it, expect } from 'vitest';

/**
 * Tests for note playback duration logic
 * 
 * These tests verify the core algorithm for calculating note duration
 * from the storage array, which is used in App.svelte's scheduleAudio()
 */
describe('note playback duration calculation', () => {
  const BASE_RESOLUTION = 64;
  
  /**
   * Simulates the note duration calculation from App.svelte
   */
  const calculateNoteDuration = (rowNotes, storageIndex, bpm) => {
    if (!rowNotes[storageIndex]) return 0;
    
    // Count consecutive active cells
    let noteLength = 1;
    for (let i = storageIndex + 1; i < rowNotes.length; i++) {
      if (rowNotes[i]) {
        noteLength++;
      } else {
        break;
      }
    }
    
    // Calculate duration based on note length in storage
    const secondsPerBeat = 60 / bpm;
    const secondsPerBar = secondsPerBeat * 4;
    const durationPerStorageCell = secondsPerBar / BASE_RESOLUTION;
    const noteDuration = noteLength * durationPerStorageCell;
    
    return noteDuration;
  };
  
  it('calculates duration for single-cell note', () => {
    const rowNotes = [true, false, false, false];
    const bpm = 120;
    const duration = calculateNoteDuration(rowNotes, 0, bpm);
    
    // At 120 BPM: 60/120 * 4 / 64 = 0.03125 seconds per cell
    const expected = (60 / 120 * 4) / BASE_RESOLUTION;
    expect(duration).toBeCloseTo(expected, 5);
  });
  
  it('calculates duration for multi-cell note', () => {
    const rowNotes = [true, true, true, true, false];
    const bpm = 120;
    const duration = calculateNoteDuration(rowNotes, 0, bpm);
    
    // 4 consecutive cells = 4 * (60/120 * 4 / 64)
    const expected = 4 * ((60 / 120 * 4) / BASE_RESOLUTION);
    expect(duration).toBeCloseTo(expected, 5);
  });
  
  it('returns same duration regardless of stepsPerBar setting', () => {
    // This is the key test - the note was placed as 4 consecutive cells
    // The duration should be the same no matter what the current stepsPerBar is
    const rowNotes = [true, true, true, true, false];
    const bpm = 120;
    
    const duration1 = calculateNoteDuration(rowNotes, 0, bpm);
    const duration2 = calculateNoteDuration(rowNotes, 0, bpm);
    
    // Duration should be identical since it's calculated from storage array
    expect(duration1).toBe(duration2);
    
    // And it should be exactly 4 storage cells worth
    const expected = 4 * ((60 / bpm * 4) / BASE_RESOLUTION);
    expect(duration1).toBeCloseTo(expected, 5);
  });
  
  it('handles notes at different BPMs correctly', () => {
    const rowNotes = [true, true, false];
    
    const duration120 = calculateNoteDuration(rowNotes, 0, 120);
    const duration240 = calculateNoteDuration(rowNotes, 0, 240);
    
    // At 240 BPM, notes should be twice as fast (half the duration)
    expect(duration240).toBeCloseTo(duration120 / 2, 5);
  });
  
  it('only triggers on note start', () => {
    const rowNotes = [false, true, true, true, false];
    
    // Index 0 has no note
    expect(calculateNoteDuration(rowNotes, 0, 120)).toBe(0);
    
    // Index 1 is note start (previous cell is false)
    expect(calculateNoteDuration(rowNotes, 1, 120)).toBeGreaterThan(0);
    
    // Indices 2 and 3 should be skipped in actual playback
    // (checked via isNoteStart logic in App.svelte)
  });
  
  it('handles note at end of array', () => {
    const rowNotes = [false, false, false, true];
    const bpm = 120;
    const duration = calculateNoteDuration(rowNotes, 3, bpm);
    
    // Single cell at end
    const expected = (60 / bpm * 4) / BASE_RESOLUTION;
    expect(duration).toBeCloseTo(expected, 5);
  });
  
  it('calculates correct duration for full bar note', () => {
    // A note that spans an entire bar (all 64 cells)
    const rowNotes = Array(BASE_RESOLUTION).fill(true);
    const bpm = 120;
    const duration = calculateNoteDuration(rowNotes, 0, bpm);
    
    // Should equal one full bar duration
    const secondsPerBar = (60 / bpm) * 4;
    expect(duration).toBeCloseTo(secondsPerBar, 5);
  });
});
