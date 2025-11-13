# Note Painting Behavior Change

## Issue
When using a 1/8 note input, painting two consecutive notes would combine them into a 1/4 note instead of keeping them as two separate 1/8 notes. This was caused by the toggle behavior in the Grid component.

## Problem Root Cause
The previous implementation in `Grid.svelte` would:
1. Check if a cell had any notes (`currentSlice.some(Boolean)`)
2. Toggle the paint value based on the current state
3. This meant painting adjacent cells would erase instead of add when a note was already present

## Solution
Changed the default painting behavior to **always add notes** when clicking/dragging without modifier keys. Added explicit keyboard modifiers for different painting modes:

### New Behavior

| Action | Modifier Key | Behavior |
|--------|-------------|----------|
| Click/Drag | None | **Always paints notes** (consecutive notes stay separate) |
| Click/Drag | Shift | **Toggle/Extend mode** (toggles notes on/off, useful for extending existing notes) |
| Click/Drag | Alt | **Erase mode** (always removes notes) |

### Previous Behavior

| Action | Modifier Key | Behavior |
|--------|-------------|----------|
| Click/Drag | None | **Toggle based on cell state** (could erase when painting consecutively) |
| Click/Drag | Shift or Alt | **Erase mode** |

## Implementation Details

### Files Changed

1. **bloops_app/src/components/Grid.svelte**
   - Added `extendMode` state variable to track Shift key
   - Modified `handlePointerDown` to separate erase and extend modes
   - Updated `handlePointer` logic to:
     - Default to `paintValue = true` (always paint)
     - Check `eraseMode` (Alt key) for explicit erase
     - Check `extendMode` (Shift key) for toggle behavior
   - Updated keyboard event handlers to track both modifiers separately
   - Updated aria-label for better accessibility description
   - Updated cursor styles: `crosshair` (default), `cell` (extend mode), `not-allowed` (erase mode)

2. **bloops_app/src/__tests__/Grid.spec.js**
   - Updated test "clicking a filled cell should remove the note" → "clicking a filled cell should still add a note (default paint behavior)"
   - Updated test "holding shift key should enable erase mode" → "holding shift key should enable extend/toggle mode"
   - Added new test "holding shift key on filled cell should toggle (remove note)" to verify toggle behavior
   - All tests now expect `value: true` for default painting behavior

3. **bloops_app/src/components/HowToGuide.svelte**
   - Updated Quick Tips section to explain new painting behavior
   - Changed text from "Click on the grid to add or remove notes" to "Click on the grid to paint notes consecutively. Hold Shift to toggle/extend notes, or Alt to erase"

## Benefits

1. **Intuitive painting**: Users can now paint consecutive notes without worrying about accidentally erasing
2. **Explicit control**: Modifier keys provide clear, distinct modes for different operations
3. **Keyboard-friendly**: Shift for toggle/extend and Alt for erase follow common UI patterns
4. **Better for music creation**: Allows quick creation of rhythmic patterns with repeated notes

## Testing

### Unit Tests
- All Grid component tests updated to reflect new behavior
- Tests cover:
  - Default painting (always adds notes)
  - Shift key toggle behavior (toggles on empty/filled cells)
  - Alt key erase behavior (always removes notes)

### Manual Testing Checklist
- [ ] Paint consecutive 1/8 notes - should create separate notes
- [ ] Hold Shift and click filled note - should remove it
- [ ] Hold Shift and click empty cell - should add note
- [ ] Hold Alt and drag - should erase notes
- [ ] Cursor changes appropriately with modifier keys
- [ ] Aria-label reads correctly for screen readers

## Accessibility Improvements

1. **Clear aria-label**: Updated to describe all three modes explicitly
2. **Visual cursor feedback**: Different cursors for each mode help users understand current state
3. **Keyboard support**: All painting modes accessible via keyboard modifiers
4. **Predictable behavior**: Default always-paint mode is easiest to understand and use

## User Experience Impact

### Positive Changes
- ✅ Consecutive note painting works as expected
- ✅ Clear separation between paint, toggle, and erase modes
- ✅ More predictable and intuitive behavior
- ✅ Better alignment with user expectations from other DAWs and sequencers

### Breaking Changes
- ⚠️ Users accustomed to toggle behavior will need to use Shift key for that mode
- ⚠️ Shift key changed from erase to toggle mode (Alt is now for erasing)

## Migration Notes

For existing users:
- Default click behavior now always paints (doesn't toggle)
- To remove notes: Use Alt key + click (not Shift anymore)
- To toggle/extend notes: Use Shift key + click (new feature)

## Future Enhancements

Potential improvements for future iterations:
1. Add a settings toggle to choose between "always paint" and "toggle" as default
2. Add visual indicator in UI showing current paint mode
3. Add undo/redo support specific to painting gestures
4. Consider touch-friendly alternatives for mobile users who can't use modifier keys
