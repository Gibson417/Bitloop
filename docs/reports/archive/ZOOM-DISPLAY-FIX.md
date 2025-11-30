# Zoom Display Coordinate Scaling Fix

## Problem Statement

When placing 4 8th notes on a 16th note grid, they appear correct (4 notes displayed in a 16-column window). However, when switching to an 8th note grid (8 columns), the notes stay in the same logical positions but the visual representation is incorrect - they appear squashed to fill the entire 8-column window instead of filling only half of it.

**Visual Description:**
- **At zoom 16 (16th note grid)**: 4 8th notes correctly occupy 8 out of 16 columns (50% of window) ✓
- **At zoom 8 (8th note grid) - BEFORE FIX**: 4 8th notes incorrectly occupy all 8 columns (100% of window) ✗
- **At zoom 8 (8th note grid) - AFTER FIX**: 4 8th notes correctly occupy 4 out of 8 columns (50% of window) ✓

The notes were "played the same, but visually represented as 1/4 notes or 8th notes with half of the grid missing."

## Root Cause

The grid rendering code assumed a 1:1 mapping between display columns and logical steps. This assumption is only valid when `zoomLevel === stepsPerBar`. 

When `zoomLevel < stepsPerBar` (zooming out, e.g., zoom=8 with stepsPerBar=16):
- Each display column should represent multiple logical steps
- Example: At zoom 8 with stepsPerBar 16, each display column represents 2 logical 16th-note steps

When `zoomLevel > stepsPerBar` (zooming in, e.g., zoom=32 with stepsPerBar=16):
- Each logical step should span multiple display columns
- Example: At zoom 32 with stepsPerBar 16, each logical step spans 2 display columns

## Solution

### Core Concept: Logical-to-Display Scale Factor

Introduced a scale factor to correctly map between coordinate systems:

```javascript
const logicalToDisplayScale = zoomLevel / stepsPerBar;
```

**Examples:**
- `zoom=8, stepsPerBar=16`: scale = 0.5 (2 logical steps per display column)
- `zoom=16, stepsPerBar=16`: scale = 1.0 (1:1 mapping)
- `zoom=32, stepsPerBar=16`: scale = 2.0 (2 display columns per logical step)

### Changes Applied

The scale factor is now consistently applied across all coordinate conversions:

#### 1. Note Rendering (lines 235-245 in Grid.svelte)
```javascript
// Convert storage → logical → display coordinates
const logicalStartCol = (start * logicalColumns) / storageColumns;
const logicalEndCol = ((start + length) * logicalColumns) / storageColumns;

// Apply scale to convert logical to display
const displayStartCol = logicalStartCol * logicalToDisplayScale;
const displayEndCol = logicalEndCol * logicalToDisplayScale;

// Adjust for current window
const windowDisplayStartCol = displayStartCol - windowOffset;
const windowDisplayEndCol = displayEndCol - windowOffset;
```

#### 2. Inactive Note Placeholders (lines 295-305)
```javascript
// Map display column back to logical steps
const logicalStartStep = (windowOffset + col) / logicalToDisplayScale;
const logicalEndStep = (windowOffset + col + 1) / logicalToDisplayScale;

// Then map to storage to check for active notes
const storageStart = Math.floor((logicalStartStep * storageColumns) / logicalColumns);
const storageEnd = Math.ceil((logicalEndStep * storageColumns) / logicalColumns);
```

#### 3. Playhead Positioning (lines 335-338)
```javascript
// Convert logical playhead position to display coordinates
const playheadDisplayStep = playheadStep * logicalToDisplayScale;
const playheadStepInWindow = playheadDisplayStep - windowOffset;
const playheadX = (playheadStepInWindow + playheadProgress * logicalToDisplayScale) * layout.cellSize;
```

#### 4. Window Calculation (lines 171-173)
```javascript
// Calculate current window using scaled playhead position
const currentWindow = manualWindow !== null 
  ? manualWindow 
  : (follow ? Math.floor((playheadStep * logicalToDisplayScale) / visibleColumns) : 0);
```

#### 5. Total Windows (lines 180-182)
```javascript
// Total windows based on scaled display columns
const totalDisplayColumns = logicalColumns * logicalToDisplayScale;
const totalWindows = Math.ceil(totalDisplayColumns / visibleColumns);
```

#### 6. Pointer Interaction (lines 420-427)
```javascript
// Map clicked display column back to logical step
const logicalToDisplayScale = zoom / stepsPerBarSafe;
const displayCol = windowOffset + col;
const logicalCol = displayCol / logicalToDisplayScale;
const stepIndex = Math.floor(logicalCol);
```

#### 7. Keyboard Navigation (lines 609-617)
```javascript
// Map focused display column back to logical step
const logicalToDisplayScale = zoom / stepsPerBarSafe;
const displayCol = windowOffset + focusedCol;
const logicalCol = displayCol / logicalToDisplayScale;
```

#### 8. Grid Lines (lines 194-198)
```javascript
// Map display column to logical step for boundary detection
const displayCol = windowOffset + col;
const logicalStep = displayCol / logicalToDisplayScale;
const isBarBoundary = Math.abs(logicalStep % stepsPerBarSafe) < 0.01;
```

## Examples

### Example 1: Zoom 8 with 16 Logical Steps (1 bar)

**Setup:**
- `stepsPerBar = 16`
- `logicalColumns = 16` (1 bar)
- `zoomLevel = 8`
- 4 8th notes placed at logical steps 0-7 (8 steps total)

**Calculations:**
- `logicalToDisplayScale = 8/16 = 0.5`
- `totalDisplayColumns = 16 * 0.5 = 8`
- `visibleColumns = 8`
- `totalWindows = ceil(8/8) = 1`

**Note Positions:**
- Logical steps 0-7 → Display columns 0-3.5
- Notes occupy 4 display columns out of 8 visible
- Visual: **50% of window** ✓

### Example 2: Zoom 32 with 16 Logical Steps (1 bar)

**Setup:**
- `stepsPerBar = 16`
- `logicalColumns = 16` (1 bar)
- `zoomLevel = 32`
- 4 8th notes at logical steps 0-7

**Calculations:**
- `logicalToDisplayScale = 32/16 = 2.0`
- `totalDisplayColumns = 16 * 2.0 = 32`
- `visibleColumns = 16` (limited by logicalColumns)
- `totalWindows = ceil(32/16) = 2`

**Note Positions:**
- Logical steps 0-7 → Display columns 0-14
- Notes occupy 14 display columns out of 16 visible in first window
- Visual: Can see very detailed subdivision of the 8th notes

### Example 3: Zoom 8 with 32 Logical Steps (2 bars)

**Setup:**
- `stepsPerBar = 16`
- `logicalColumns = 32` (2 bars)
- `zoomLevel = 8`

**Calculations:**
- `logicalToDisplayScale = 8/16 = 0.5`
- `totalDisplayColumns = 32 * 0.5 = 16`
- `visibleColumns = 8`
- `totalWindows = ceil(16/8) = 2`

**Result:**
- Window 0: Shows display columns 0-7 (logical steps 0-15, first bar at 8th-note resolution)
- Window 1: Shows display columns 8-15 (logical steps 16-31, second bar at 8th-note resolution)

## Test Coverage

### Updated Tests

**`Grid.zoom-visible-columns.spec.js`:**
- Updated expectation for zoom 8 with 1 bar (totalWindows: 2 → 1)
- Added test for zoom 8 with 2 bars (totalWindows = 2)
- Updated multi-zoom test to calculate expected windows with scale factor

### New Tests

**`Grid.zoom-display-fix.spec.js`:**
1. **4 8th notes in half window**: Verifies notes appear in 50% of window at both zoom levels
2. **Window offset calculation**: Tests playhead at step 8 with zoom 8 stays in window 0
3. **Window switching**: Tests playhead at step 16 switches to window 1
4. **Visual proportions**: Confirms 2 8th notes appear as 1/4 window at both zoom 8 and 16

## Backward Compatibility

### For Users
- **Default behavior unchanged**: When `zoomLevel === stepsPerBar`, scale = 1.0 (no change)
- **Existing projects load correctly**: No project file format changes
- **Visual consistency improved**: Notes now maintain their visual proportions when zooming

### For Developers
- **No API changes**: All existing Grid component props work the same
- **No breaking changes**: Existing functionality preserved
- **Internal improvement only**: Coordinate mapping is now mathematically correct

## Benefits

1. **Correct visual representation**: Notes maintain their proportional size when zooming
2. **Consistent musical meaning**: An 8th note looks like an 8th note regardless of zoom level
3. **Better UX**: Users can zoom out to see overview while notes remain recognizable
4. **Accurate playhead behavior**: Playhead position scales correctly with zoom
5. **Proper window switching**: Multi-window navigation works correctly at all zoom levels

## Implementation Notes

### Precision Considerations

Grid line boundary detection uses a small epsilon (0.01) for floating-point comparison:
```javascript
const isBarBoundary = Math.abs(logicalStep % stepsPerBarSafe) < 0.01;
```

This handles cases where `logicalStep` might be 15.999999... due to floating-point arithmetic.

### Performance Impact

- **Negligible overhead**: One additional multiplication/division per coordinate conversion
- **No DOM changes**: Canvas rendering performance unchanged
- **No new allocations**: Calculations use existing variables

## Related Files

- `/bloops_app/src/components/Grid.svelte` - Main grid component with coordinate scaling
- `/bloops_app/src/__tests__/Grid.zoom-visible-columns.spec.js` - Updated tests
- `/bloops_app/src/__tests__/Grid.zoom-display-fix.spec.js` - New tests demonstrating fix
- `/docs/ZOOM-NOTE-LENGTH-SEPARATION.md` - Original zoom/note-length independence doc

## Future Enhancements

1. **Fractional grid lines**: When zoomed out, could show faint sub-division lines
2. **Zoom presets**: Quick access to common zoom levels (e.g., "Bar View", "Detail View")
3. **Smooth zoom transitions**: Animated zoom with easing for better visual feedback
4. **Mini-map**: Overview showing current zoom window position in full timeline

---

**Fix Date:** 2025-11-16  
**Issue:** "when i place 4 8th notes on a 16th note grid... When I switch to 8th note grid... the window is just half full"  
**Status:** ✅ Fixed and tested
