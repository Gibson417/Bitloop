# Note Duration and Articulation Fix

## Problem Statement

When painting notes across the grid, the notes would span the appropriate visual length but would not articulate at the appropriate duration during playback. Specifically:

1. **Original Issue**: When painting a line of 1/8th notes, they would be heard as 1/16th notes with 1/16th note rests in between
2. **Additional Issue**: When placing two 1/8th notes side by side with single clicks, they would combine into one 1/4 note instead of remaining as two separate 1/8th notes

This was fundamentally incompatible with the app's goal of being focused on musical and rhythm composition.

## Root Cause Analysis

The application uses a **boolean matrix** (2D array of true/false values) to store notes:
- Each `true` value represents an active note position at that storage step
- Consecutive `true` values were interpreted as a single long note during playback

### Specific Issues

1. **Playback Scanning**: The scheduler calls `handleStep()` for each logical step (e.g., every 1/16th note). The playback code would map this to a storage index and only check that ONE index for notes. This meant:
   - Notes starting at "in-between" storage positions were never triggered
   - Only notes aligned to logical step boundaries would play

2. **Note Merging**: When users placed two notes side by side:
   - First note: storage steps 0-7 → all `true`
   - Second note: storage steps 8-15 → all `true`
   - Result: Storage steps 0-15 all `true` = played as one 16-step note

## Solution

The fix consists of two complementary changes:

### 1. Enhanced Playback Scanning (App.svelte)

**File**: `bloops_app/src/App.svelte`  
**Function**: `scheduleAudio()`

**Change**: Instead of checking only the aligned storage index for each logical step, now scan **all storage indices** within that logical step's range.

```javascript
// OLD: Only check one storage index per logical step
const storageIndex = Math.floor(stepIndex * (BASE_RESOLUTION / state.stepsPerBar));
if (rowNotes[storageIndex]) {
  // trigger note
}

// NEW: Check all storage indices in the logical step range
const storageStart = Math.floor(stepIndex * (BASE_RESOLUTION / state.stepsPerBar));
const storageEnd = Math.floor((stepIndex + 1) * (BASE_RESOLUTION / state.stepsPerBar));

for (let storageIndex = storageStart; storageIndex < storageEnd; storageIndex++) {
  if (rowNotes[storageIndex]) {
    const isNoteStart = (storageIndex === 0) || !rowNotes[storageIndex - 1];
    if (isNoteStart) {
      // trigger note with timing offset
    }
  }
}
```

**Benefits**:
- Notes starting at ANY storage position are now detected
- Each note start is triggered independently
- Timing offset is calculated so notes play at the correct sub-step time
- Multiple notes within one logical step are all triggered correctly

### 2. Automatic Articulation Gap (Grid.svelte)

**File**: `bloops_app/src/components/Grid.svelte`  
**Function**: `handlePointer()`

**Change**: When placing notes in single-click mode, reduce note length by 1 storage step to create a gap.

```javascript
// In single-click mode with active notes
storageLength = drawingTool === 'single' && cellPaintValue && noteStorageLength > 1 
  ? noteStorageLength - 1  // Reduce by 1 for articulation gap
  : noteStorageLength;      // Use full length in paint/erase modes
```

**Example** (1/8th notes at 16 steps per bar):
- Note length = 64 / 8 = 8 storage steps
- Single-click mode: Use 7 steps, leave 1 step gap
- First note: steps 0-6 (gap at 7)
- Second note: steps 8-14 (gap at 15)
- Result: Two separate 7-step notes with 1-step gaps

**Benefits**:
- Adjacent notes remain discrete for rhythm composition
- Single clicks create staccato-style articulation (appropriate for drums, percussion, melody)
- Paint mode (drag) still creates legato notes by using full length
- Gap is minimal (1/64th of a bar) but sufficient for audio separation

### 3. Note Duration Adjustment

Reduced the note duration multiplier from 0.95 to 0.90 (10% gate reduction instead of 5%). This provides:
- Better separation between adjacent notes
- Prevents audio overlap/blurring
- More "musical" articulation for rhythm composition

## Testing

Created comprehensive test suite in `bloops_app/src/__tests__/notePlayback.articulation.spec.js`:

1. ✅ Two separate 1/8th notes placed side by side are detected correctly
2. ✅ Multiple notes starting within the same logical step are all triggered
3. ✅ Notes with gaps between them work correctly
4. ✅ Continuous notes spanning multiple logical steps work as before
5. ✅ Different zoom levels and note resolutions all work correctly

**Test Results**: 82 tests passing (5 new tests added for articulation)

## User Impact

### Before Fix
- ❌ Adjacent single-click notes merged into one long note
- ❌ Notes would play at wrong durations (1/16th instead of 1/8th)
- ❌ Rhythm composition was impossible with discrete notes
- ❌ Only continuous/legato note patterns worked correctly

### After Fix
- ✅ Adjacent single-click notes remain separate and articulate properly
- ✅ Notes play at correct durations matching their visual length
- ✅ Rhythm composition works with discrete, staccato notes
- ✅ Paint mode still creates continuous legato notes when desired
- ✅ Musical articulation appropriate for rhythm-focused composition

## Backward Compatibility

- Existing projects will load correctly
- Notes stored in the boolean matrix format are unchanged
- Playback improvements apply automatically to all projects
- Paint mode (drag) behavior unchanged - still creates continuous notes
- Only single-click mode adds articulation gaps (new behavior that fixes the bug)

## Technical Details

### Storage Resolution
- `BASE_RESOLUTION = 64` (64 storage steps per bar)
- Each storage step = 1/64th of a bar
- Articulation gap = 1 storage step = 1/64th of a bar ≈ 15ms at 120 BPM

### Logical vs Storage Steps
- Logical steps: User-visible grid resolution (e.g., 16 steps per bar = 1/16th notes)
- Storage steps: Internal high-resolution storage (always 64 per bar)
- Ratio: `storagePerLogical = 64 / stepsPerBar` (e.g., 4 when stepsPerBar = 16)

### Note Triggering Flow
1. Scheduler calls `handleStep(stepIndex, time, duration)` for each logical step
2. Calculate storage range: `[stepIndex * ratio, (stepIndex + 1) * ratio)`
3. Scan all storage indices in this range
4. For each active index, check if it's a note start (previous index is inactive)
5. Calculate note length by scanning forward until finding inactive index
6. Trigger note with timing offset: `time + (storageIndex - storageStart) * storageStepDuration`

## Performance

No significant performance impact:
- Inner loop scans at most 4-8 storage indices per logical step (depending on resolution)
- Note start detection is O(1) check
- Note length scanning is O(n) where n = note length, but bounded by storage resolution
- Overall: Negligible impact on scheduling performance

## Future Enhancements

While this fix addresses the core issue, future improvements could include:

1. **Note Events Architecture**: Replace boolean matrix with discrete note events (`{start, length, velocity}`)
   - Would make note boundaries explicit
   - Enable per-note velocities and other parameters
   - More flexible for future features (note ties, slides, etc.)

2. **Adjustable Gate Percentage**: Allow users to control articulation amount
   - UI slider for staccato (50%) to legato (100%)
   - Per-track or global setting

3. **Swing/Groove Quantization**: Add timing variations for more natural rhythm
   - Shuffle/swing feel
   - Humanization options

4. **Visual Gap Indicators**: Show the articulation gaps in the grid UI
   - Help users understand discrete vs continuous notes
   - Visual feedback for rhythm composition
