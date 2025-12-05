# Zoom and Note Length Separation

## Overview

This document describes the separation of grid density (zoom) from note length functionality.

## Problem Statement

Previously, the note length selector (`1/8`, `1/16`, `1/32`, `1/64`) affected both:
1. The duration of placed notes
2. The grid density/resolution (how many subdivisions are visible)

This created confusion because changing the note length would also change how zoomed in the grid appeared.

## Solution

The functionality has been separated into two independent controls:

### 1. Zoom Control (Grid Density)
- **Location**: Grid toolbar (right side)
- **Range**: `1/8` to `1/64`
- **Default**: `1/16` (matches default `stepsPerBar`)
- **Function**: Controls the grid resolution/density - how fine-grained the grid appears
- **Implementation**: `zoomLevel` prop in Grid component

### 2. Note Length Control (Note Duration)
- **Location**: Grid toolbar (left side)
- **Range**: `1` to `1/64`
- **Default**: `1/8`
- **Function**: Controls the duration of notes when placed
- **Implementation**: `noteLengthDenominator` prop in Grid component

## Technical Changes

### Grid.svelte
- Now uses `zoomLevel` to calculate `displayColumns` (grid density)
- Uses `noteLengthDenominator` to calculate `noteStorageLength` (note duration)
- Updated in three places:
  1. `updateLayout()` function
  2. `draw()` function
  3. `handlePointer()` function
  4. `handleKeyDown()` function (keyboard note entry)

### ZoomControls.svelte
- Changed valid zoom levels from `[1, 2, 4, 8, 16, 32, 64]` to `[8, 16, 32, 64]`
- Default zoom level changed from `1` to `16` (matching default `stepsPerBar`)

### App.svelte
- Removed automatic adjustment of `stepsPerBar` based on note length
- Initialized `zoomLevel` to `16` (default grid resolution of 1/16)
- Note length selection now only affects note duration, not grid density

## User Experience

### Before
1. Select note length `1/32`
2. Grid automatically zooms in to show 32nd notes
3. Place a note → note duration is 1/32
4. **Issue**: Can't see coarse grid with fine note placement

### After
1. Select zoom level `1/16` → Grid shows 16th note divisions
2. Select note length `1/32` → Note duration is 1/32
3. Place a note → note is 1/32 duration but grid stays at 1/16 resolution
4. **Benefit**: Can place fine notes while viewing coarse grid, or vice versa

## Examples

### Example 1: Fine Grid, Coarse Notes
- Zoom: `1/32` (fine grid)
- Note Length: `1/8` (long notes)
- Result: See detailed grid but place longer notes

### Example 2: Coarse Grid, Fine Notes
- Zoom: `1/8` (coarse grid)
- Note Length: `1/32` (short notes)
- Result: See broad overview but place short notes

### Example 3: Independent Control
- Zoom: `1/16` (default)
- Note Length: `1/16` (default)
- User zooms in to `1/64` to see details
- Note length remains `1/16` → notes maintain consistent duration
- User can change note length to `1/64` if desired → independent of zoom

## Implementation Details

### Grid Resolution Calculation
```javascript
// Use zoomLevel for grid density
const zoom = Number(zoomLevel) || 1;
const displayColumns = zoom && Number.isFinite(zoom) && zoom > 0
  ? Math.max(1, Math.floor((logicalColumns * zoom) / stepsPerBarSafe))
  : logicalColumns;
```

### Note Duration Calculation
```javascript
// Use noteLengthDenominator for note duration
const noteDenom = Number(noteLengthDenominator) || stepsPerBarSafe;
const noteStorageLength = Math.max(1, Math.round((BASE_RESOLUTION / noteDenom)));
// Apply 75% for gaps between notes
const storageLength = Math.max(1, Math.floor(noteStorageLength * 0.75));
```

## Backward Compatibility

- Default values match previous behavior (`1/16` for both zoom and note length)
- Existing projects will load with default settings
- No breaking changes to project file format
- All existing functionality preserved

## Testing

### Manual Testing Checklist
- [ ] Zoom in/out while keeping note length constant
- [ ] Change note length while keeping zoom constant
- [ ] Place notes at different zoom levels
- [ ] Verify note duration matches selected note length
- [ ] Test with keyboard note entry (Enter key)
- [ ] Test with mouse/touch note entry
- [ ] Test in extend mode (Ctrl/Cmd)
- [ ] Test in erase mode (Shift/Alt)

### Expected Behavior
1. Changing zoom should not affect note duration
2. Changing note length should not affect grid density
3. Grid lines should adjust based on zoom level
4. Placed notes should have duration based on note length setting
5. Window switcher should work independently of zoom

## Future Enhancements

- Add keyboard shortcuts for zoom (e.g., `+`/`-` keys)
- Add preset combinations (e.g., "Fine detail", "Broad view")
- Add visual indicator showing relationship between zoom and note length
- Add ability to sync zoom and note length with a toggle

## Related Files

- `unknown_app/src/components/Grid.svelte`
- `unknown_app/src/components/ZoomControls.svelte`
- `unknown_app/src/App.svelte`
- `unknown_app/src/store/projectStore.js` (BASE_RESOLUTION constant)

## References

- Issue: "Note length should not effect grid density. Zoom function should change grid density/resolution. with the range being 1/8-1/64."
- PR: copilot/update-grid-density-logic
