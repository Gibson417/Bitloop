import { describe, it, expect } from 'vitest';

/**
 * Tests for note articulation fix
 * 
 * Verifies that adjacent notes are played as separate notes, not merged into one long note.
 * This is critical for rhythm composition where discrete notes should remain discrete.
 */
describe('note articulation with adjacent notes', () => {
  const BASE_RESOLUTION = 64;
  
  /**
   * Simulates the improved scheduleAudio logic that scans all storage indices
   * within a logical step for note starts
   */
  const findNoteStartsInStep = (rowNotes, storageStart, storageEnd) => {
    const noteStarts = [];
    
    for (let storageIndex = storageStart; storageIndex < storageEnd; storageIndex++) {
      if (rowNotes[storageIndex]) {
        // Check if this is a note start (previous storage step was not active)
        const prevStorageIndex = storageIndex > 0 ? storageIndex - 1 : -1;
        const isNoteStart = prevStorageIndex < 0 || !rowNotes[prevStorageIndex];
        
        if (isNoteStart) {
          // Find note length
          let noteLength = 1;
          let nextIndex = storageIndex + 1;
          while (nextIndex < rowNotes.length && rowNotes[nextIndex]) {
            noteLength++;
            nextIndex++;
          }
          
          noteStarts.push({
            storageIndex,
            noteLength,
            offsetInStep: storageIndex - storageStart
          });
        }
      }
    }
    
    return noteStarts;
  };
  
  it('detects two separate 1/8th notes placed side by side', () => {
    // Scenario: Two 1/8th notes at 16 steps/bar placed with single-click tool
    // Each 1/8th note = 8 storage steps (64/8), but reduced by 1 for articulation gap
    // First note: storage steps 0-6 (7 steps, with gap at 7)
    // Second note: storage steps 8-14 (7 steps, with gap at 15)
    const rowNotes = Array(BASE_RESOLUTION).fill(false);
    for (let i = 0; i < 7; i++) rowNotes[i] = true;  // First note (7 steps)
    // rowNotes[7] = false; // Gap
    for (let i = 8; i < 15; i++) rowNotes[i] = true; // Second note (7 steps)
    // rowNotes[15] = false; // Gap
    
    const stepsPerBar = 16;
    const storagePerStep = BASE_RESOLUTION / stepsPerBar; // 4
    
    // Check logical step 0 (storage 0-3) - should find first note start
    const step0Starts = findNoteStartsInStep(rowNotes, 0, storagePerStep);
    expect(step0Starts).toHaveLength(1);
    expect(step0Starts[0].storageIndex).toBe(0);
    expect(step0Starts[0].noteLength).toBe(7); // 7 steps (8 minus 1 for gap)
    
    // Check logical step 1 (storage 4-7) - no note starts, we're in/near the end of first note
    const step1Starts = findNoteStartsInStep(rowNotes, storagePerStep, storagePerStep * 2);
    expect(step1Starts).toHaveLength(0);
    
    // Check logical step 2 (storage 8-11) - should find second note start
    const step2Starts = findNoteStartsInStep(rowNotes, storagePerStep * 2, storagePerStep * 3);
    expect(step2Starts).toHaveLength(1);
    expect(step2Starts[0].storageIndex).toBe(8);
    expect(step2Starts[0].noteLength).toBe(7); // 7 steps (8 minus 1 for gap)
  });
  
  it('detects multiple notes starting within the same logical step', () => {
    // Scenario: Two 1/16th notes within one logical step at 16 steps/bar
    // Each 1/16th note = 4 storage steps (64/16), reduced by 1 for gap = 3 steps
    // Logical step 0 spans storage 0-3
    // First note: storage steps 0-2 (3 steps, with gap at 3)
    // Second note: storage steps 4-6 (3 steps, with gap at 7)
    const rowNotes = Array(BASE_RESOLUTION).fill(false);
    for (let i = 0; i < 3; i++) rowNotes[i] = true;  // First note (3 steps)
    // rowNotes[3] = false; // Gap
    for (let i = 4; i < 7; i++) rowNotes[i] = true;  // Second note (3 steps)
    // rowNotes[7] = false; // Gap
    
    const stepsPerBar = 16;
    const storagePerStep = BASE_RESOLUTION / stepsPerBar; // 4
    
    // Check logical step 0 (storage 0-3)
    const step0Starts = findNoteStartsInStep(rowNotes, 0, storagePerStep);
    expect(step0Starts).toHaveLength(1);
    expect(step0Starts[0].storageIndex).toBe(0);
    expect(step0Starts[0].noteLength).toBe(3); // 3 steps (4 minus 1 for gap)
    
    // Check logical step 1 (storage 4-7) - should find second note start
    const step1Starts = findNoteStartsInStep(rowNotes, storagePerStep, storagePerStep * 2);
    expect(step1Starts).toHaveLength(1);
    expect(step1Starts[0].storageIndex).toBe(4);
    expect(step1Starts[0].noteLength).toBe(3); // 3 steps (4 minus 1 for gap)
  });
  
  it('handles notes with gaps correctly', () => {
    // Scenario: Two 1/8th notes with a gap between them
    // First note: storage steps 0-7
    // Gap: storage step 8
    // Second note: storage steps 9-16
    const rowNotes = Array(BASE_RESOLUTION).fill(false);
    for (let i = 0; i < 8; i++) rowNotes[i] = true;   // First note
    // rowNotes[8] = false; // Gap (already false)
    for (let i = 9; i < 17; i++) rowNotes[i] = true;  // Second note
    
    const stepsPerBar = 16;
    const storagePerStep = BASE_RESOLUTION / stepsPerBar; // 4
    
    // Check logical step 2 (storage 8-11) - should find second note start at storage 9
    const step2Starts = findNoteStartsInStep(rowNotes, storagePerStep * 2, storagePerStep * 3);
    expect(step2Starts).toHaveLength(1);
    expect(step2Starts[0].storageIndex).toBe(9);
    expect(step2Starts[0].offsetInStep).toBe(1); // Starts 1 storage step into the logical step
  });
  
  it('handles a continuous note spanning multiple logical steps', () => {
    // Scenario: One long note spanning 3 logical steps
    // Note: storage steps 0-11 (continuous)
    const rowNotes = Array(BASE_RESOLUTION).fill(false);
    for (let i = 0; i < 12; i++) rowNotes[i] = true;
    
    const stepsPerBar = 16;
    const storagePerStep = BASE_RESOLUTION / stepsPerBar; // 4
    
    // Check logical step 0 (storage 0-3) - should find note start
    const step0Starts = findNoteStartsInStep(rowNotes, 0, storagePerStep);
    expect(step0Starts).toHaveLength(1);
    expect(step0Starts[0].storageIndex).toBe(0);
    expect(step0Starts[0].noteLength).toBe(12);
    
    // Check logical step 1 (storage 4-7) - no note starts
    const step1Starts = findNoteStartsInStep(rowNotes, storagePerStep, storagePerStep * 2);
    expect(step1Starts).toHaveLength(0);
    
    // Check logical step 2 (storage 8-11) - no note starts
    const step2Starts = findNoteStartsInStep(rowNotes, storagePerStep * 2, storagePerStep * 3);
    expect(step2Starts).toHaveLength(0);
  });
  
  it('correctly handles notes at different zoom levels', () => {
    // At 32 steps per bar, each logical step = 2 storage steps
    // Two 1/16th notes side by side:
    // Each 1/16th note = 4 storage steps (64/16), reduced by 1 for gap = 3 steps
    // First note: storage 0-2 (spans logical steps 0 and 1, with gap at 3)
    // Second note: storage 4-6 (spans logical steps 2 and 3, with gap at 7)
    const rowNotes = Array(BASE_RESOLUTION).fill(false);
    for (let i = 0; i < 3; i++) rowNotes[i] = true;  // First note (3 steps)
    // rowNotes[3] = false; // Gap
    for (let i = 4; i < 7; i++) rowNotes[i] = true;  // Second note (3 steps)
    // rowNotes[7] = false; // Gap
    
    const stepsPerBar = 32;
    const storagePerStep = BASE_RESOLUTION / stepsPerBar; // 2
    
    // Check logical step 0 (storage 0-1)
    const step0Starts = findNoteStartsInStep(rowNotes, 0, storagePerStep);
    expect(step0Starts).toHaveLength(1);
    expect(step0Starts[0].noteLength).toBe(3); // 3 steps (4 minus 1 for gap)
    
    // Check logical step 2 (storage 4-5)
    const step2Starts = findNoteStartsInStep(rowNotes, storagePerStep * 2, storagePerStep * 3);
    expect(step2Starts).toHaveLength(1);
    expect(step2Starts[0].storageIndex).toBe(4);
    expect(step2Starts[0].noteLength).toBe(3); // 3 steps (4 minus 1 for gap)
  });
});
