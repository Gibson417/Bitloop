# Manual Testing Guide: Note Resolution Playback Fix

## Overview
This document provides a manual testing procedure to verify that note playback duration remains constant regardless of the note resolution selector setting.

## Problem Being Fixed
Previously, when users changed the note resolution selector (e.g., from 1/16 to 1/32), the playback duration of existing notes would change. This was incorrect - notes should always play for their original length regardless of the current resolution display setting.

## Testing Setup

### Prerequisites
1. Build and run the Bitloop application locally
2. Have audio enabled to hear playback
3. Use Chrome/Firefox with Web Audio API support

### Test Environment
- Access the application at `http://localhost:5173` (or your dev server port)
- Ensure you're on a fresh session or create a new project

## Test Cases

### Test Case 1: Single Note Duration Consistency

**Objective**: Verify a single note maintains its duration when resolution changes

**Steps**:
1. Set BPM to 120
2. Set Bars to 1
3. Set note resolution to **1/16**
4. Place a single note in row 4, column 0 (first step)
5. Start playback and listen to/observe the note duration
6. Stop playback
7. Change note resolution to **1/32**
8. Start playback again
9. Listen to/observe the note duration

**Expected Result**:
- The note duration should sound identical in both cases
- The visual grid may show more columns at 1/32, but playback should be unchanged
- The note should play for approximately 0.125 seconds (1/16 of a bar at 120 BPM)

**Pass Criteria**: ✅ Note duration is perceptually identical at both resolutions

---

### Test Case 2: Long Note Duration Preservation

**Objective**: Verify longer notes maintain their duration

**Steps**:
1. Set BPM to 120
2. Set Bars to 1
3. Set note resolution to **1/16**
4. Place a note in row 4, columns 0-3 (4 steps, should be 1/4 bar)
5. Start playback and time the note duration
6. Stop playback
7. Change note resolution to **1/64**
8. Start playback and time the note duration

**Expected Result**:
- The note should play for approximately 0.5 seconds (1/4 bar at 120 BPM) in both cases
- At 1/64 resolution, the visual grid shows more detail but the note duration is preserved

**Pass Criteria**: ✅ Long note maintains 0.5s duration regardless of resolution

---

### Test Case 3: Multiple Notes at Different Lengths

**Objective**: Verify multiple notes with different lengths all preserve their durations

**Steps**:
1. Set BPM to 120, Bars to 2, Resolution to **1/16**
2. Place notes:
   - Row 7: Short note at column 0 (1 cell)
   - Row 5: Medium note at column 4-7 (4 cells)
   - Row 3: Long note at column 8-15 (8 cells)
3. Listen to playback and note the relative durations
4. Change resolution to **1/32**
5. Listen to playback again

**Expected Result**:
- All three notes maintain their relative durations
- Short note: ~0.125s
- Medium note: ~0.5s
- Long note: ~1.0s
- Changing resolution doesn't affect any of the durations

**Pass Criteria**: ✅ All notes maintain their original lengths

---

### Test Case 4: BPM Changes

**Objective**: Verify notes scale correctly with BPM but remain resolution-independent

**Steps**:
1. Set Bars to 1, Resolution to **1/16**
2. Set BPM to **60**
3. Place a note in row 4, columns 0-3 (4 cells)
4. Listen to playback (should be slow: ~1.0s duration)
5. Change BPM to **240**
6. Listen to playback (should be fast: ~0.25s duration)
7. Change resolution to **1/32**
8. Verify playback still fast at same duration

**Expected Result**:
- Note duration correctly scales with BPM
- Note duration remains independent of resolution setting
- At 240 BPM with resolution change, duration stays ~0.25s

**Pass Criteria**: ✅ Notes scale with BPM, not resolution

---

### Test Case 5: WAV Export Verification

**Objective**: Verify exported WAV files preserve note durations

**Steps**:
1. Create a project with notes at various lengths
2. Set resolution to **1/16**
3. Export to WAV
4. Change resolution to **1/64**
5. Export to WAV again
6. Compare both WAV files in an audio editor (e.g., Audacity)

**Expected Result**:
- Both WAV files should be identical
- Note start times and durations should match exactly
- No difference in waveform between exports

**Pass Criteria**: ✅ WAV exports are identical regardless of resolution

---

### Test Case 6: MIDI Export Verification

**Objective**: Verify MIDI export preserves note lengths

**Steps**:
1. Create a project with varied note lengths
2. Export to MIDI at resolution **1/16**
3. Change resolution to **1/32**
4. Export to MIDI again
5. Compare MIDI files in a DAW or MIDI viewer

**Expected Result**:
- Both MIDI files should have identical note start times
- Note durations (Note On to Note Off) should match exactly
- MIDI tick positions should be consistent

**Pass Criteria**: ✅ MIDI exports are identical regardless of resolution

---

### Test Case 7: Visual Grid vs. Playback

**Objective**: Ensure visual grid changes don't affect playback

**Steps**:
1. Place notes at various positions
2. Start playback
3. While playing, change resolution multiple times (1/16 → 1/32 → 1/64 → 1/16)
4. Listen for any changes in playback

**Expected Result**:
- Grid visually updates to show different resolutions
- Playback continues smoothly without duration changes
- No audio artifacts or glitches during resolution changes

**Pass Criteria**: ✅ Playback unaffected by live resolution changes

---

### Test Case 8: Edge Case - Maximum Resolution

**Objective**: Verify extreme resolution settings work correctly

**Steps**:
1. Set resolution to **1/64** (maximum)
2. Place very short notes (1-2 cells)
3. Place longer notes (8+ cells)
4. Verify playback at 1/64
5. Change to **1/16** and verify durations preserved

**Expected Result**:
- Very short notes at 1/64 still play audibly
- Duration calculation doesn't overflow or underflow
- All notes maintain correct durations

**Pass Criteria**: ✅ Extreme resolutions handled correctly

---

## Regression Testing

Run existing test suite to ensure no features broken:

```bash
cd unknown_app
npm run test
```

Expected: All existing tests pass + new notePlayback.spec.js passes

---

## Visual Inspection Checklist

While testing, also verify:

- [ ] Playhead moves smoothly during playback
- [ ] Grid rendering is crisp at all resolutions
- [ ] No visual artifacts when changing resolution
- [ ] Track controls remain functional
- [ ] Undo/redo still works correctly
- [ ] Save/load preserves note data
- [ ] Copy/paste operations work

---

## Acceptance Criteria Summary

The fix is successful if:

1. ✅ All 8 test cases pass
2. ✅ Automated tests pass (including new notePlayback.spec.js)
3. ✅ No regressions in existing functionality
4. ✅ Visual grid updates don't affect audio playback
5. ✅ WAV and MIDI exports are resolution-independent

---

## Known Limitations

- Notes shorter than 50ms (minDuration) will be padded to prevent audio clicks
- This is intentional and prevents DSP artifacts

---

## Troubleshooting

If issues are found:

1. Check browser console for errors
2. Verify Web Audio API is supported
3. Ensure audio context is resumed (browser autoplay policy)
4. Check that BASE_RESOLUTION constant is 64 in all files
5. Verify note data in storage array (inspect with dev tools)

---

## Technical Notes

The fix changes note duration calculation from:
- **Before**: `duration = stepDuration` (based on current resolution)
- **After**: `duration = noteLength × (secondsPerBar / BASE_RESOLUTION)` (based on storage)

This ensures duration is calculated from actual note data, not display settings.
