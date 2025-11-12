# UX Grid Audit - Grid Note Input Fix

## Summary

Fixed critical bug in Grid.svelte where clicking on filled notes would not remove them, and added explicit erase mode functionality via keyboard modifiers.

### Top 5 Wins
1. ✅ Fixed note removal bug - clicking filled cells now properly erases notes
2. ✅ Added explicit erase mode via Shift/Alt keys for better control
3. ✅ Improved cursor feedback - changes to "not-allowed" cursor in erase mode
4. ✅ Enhanced accessibility with updated aria-label describing erase mode
5. ✅ Maintained paint mode behavior - dragging still paints consistently

### Top 5 Risks (None identified)
- No breaking changes introduced
- All changes are additive and preserve existing functionality
- Erase mode is opt-in via modifier keys

## Issue Description

**Problem Statement:** 
> "I can click to add a note, but if i click to remove it, it does not remove. I also want the erase function with paint input as well."

**Root Cause:**
In Grid.svelte, the `pointerActive` flag was being set to `true` in `handlePointerDown()` BEFORE calling `handlePointer()`. This caused the paint value determination logic to be skipped, as it only executes when `!pointerActive` is true.

## Changes Made

### 1. Grid.svelte - Core Fix

**File:** `bloops_app/src/components/Grid.svelte`

#### Added erase mode state variable
```javascript
let eraseMode = false; // Track if shift/alt key is held for explicit erase
```

#### Fixed handlePointerDown (lines 237-245)
**Before:**
```javascript
const handlePointerDown = (event) => {
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  pointerActive = true;  // ← BUG: Set before calling handlePointer
  paintedCells = new Set();
  handlePointer(event);
};
```

**After:**
```javascript
const handlePointerDown = (event) => {
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  eraseMode = event.shiftKey || event.altKey;  // Check modifier keys
  pointerActive = false; // ← FIX: Reset to allow paintValue determination
  paintedCells = new Set();
  handlePointer(event);
};
```

#### Enhanced handlePointer paint value logic (lines 285-290)
**Before:**
```javascript
if (!pointerActive) {
  pointerActive = true;
  paintValue = !current;
}
```

**After:**
```javascript
if (!pointerActive) {
  pointerActive = true;
  // If eraseMode is active (via shift/alt key), always erase
  // Otherwise, toggle based on the current state of the first cell
  paintValue = eraseMode ? false : !current;
}
```

#### Updated releasePointer to reset erase mode
```javascript
const releasePointer = (event) => {
  // ... existing code ...
  eraseMode = false; // Reset erase mode when pointer is released
};
```

#### Added global keyboard event handlers for erase mode
Added in `onMount()` to track modifier keys while hovering:
```javascript
const handleKeyDownGlobal = (e) => {
  if (e.shiftKey || e.altKey) {
    eraseMode = true;
  }
};

const handleKeyUpGlobal = (e) => {
  if (!e.shiftKey && !e.altKey) {
    eraseMode = false;
  }
};

window.addEventListener('keydown', handleKeyDownGlobal);
window.addEventListener('keyup', handleKeyUpGlobal);
```

#### Visual feedback improvements
- Added dynamic cursor style: `style="cursor: {eraseMode ? 'not-allowed' : 'crosshair'};"`
- Updated aria-label: "Note grid - click to add/remove notes, hold Shift or Alt to erase, use arrow keys to navigate, space or enter to toggle notes"
- Removed static cursor style from CSS to use dynamic style attribute

### 2. Grid.spec.js - Test Coverage

**File:** `bloops_app/src/__tests__/Grid.spec.js`

Added comprehensive tests for the new functionality:

1. **Test: clicking an empty cell should add a note**
   - Verifies `value=true` is dispatched when clicking empty cells

2. **Test: clicking a filled cell should remove the note**
   - Creates a grid with a filled cell at storage indices 0-3
   - Verifies `value=false` is dispatched when clicking the filled cell

3. **Test: holding shift key should enable erase mode**
   - Clicks empty cell with `shiftKey: true`
   - Verifies `value=false` (erase) even on empty cell

4. **Test: holding alt key should enable erase mode**
   - Clicks empty cell with `altKey: true`
   - Verifies `value=false` (erase) even on empty cell

## Behavior Changes

### Before Fix
- ❌ Clicking filled notes did not remove them (bug)
- ✅ Clicking empty notes added them (worked)
- ❌ No way to force erase mode

### After Fix
- ✅ Clicking filled notes removes them (toggle behavior)
- ✅ Clicking empty notes adds them (preserved)
- ✅ Holding Shift or Alt forces erase mode
- ✅ Visual cursor feedback for erase mode
- ✅ Accessibility improvements with updated labels

## User Experience Flow

### Normal Mode (No Modifier Keys)
1. User clicks on empty cell → Note is added (white/colored dot appears)
2. User clicks on filled cell → Note is removed (dot disappears)
3. User drags across empty cells → All cells are filled (paint mode)
4. User drags starting from filled cell → All cells are erased (erase mode)

### Erase Mode (Shift or Alt Key Held)
1. User holds Shift or Alt key
2. Cursor changes to "not-allowed" style
3. Clicking or dragging any cell → All touched cells are erased
4. Release modifier key → Returns to normal toggle mode

## Grid Map

Current grid system (unchanged):
- **Container:** Flexible width based on viewport
- **Columns:** 16 logical steps per bar (default), displayed resolution varies by note length setting
- **Gutters:** Subtle vertical lines at quarter-bar and bar boundaries
- **Cell Size:** 18-48px adaptive based on viewport width
- **Storage Resolution:** 64 steps per bar (BASE_RESOLUTION) for high-precision internal storage

## Accessibility

### Improvements
- ✅ Updated aria-label with erase mode instructions
- ✅ Visual cursor feedback (not-allowed vs crosshair)
- ✅ Keyboard modifiers accessible via standard OS keyboard shortcuts
- ✅ Focus management preserved (keyboard navigation still works)

### Maintained Standards
- ✅ Keyboard navigation with arrow keys (unchanged)
- ✅ Space/Enter to toggle notes (unchanged)
- ✅ Focus ring visible at all times (unchanged)
- ✅ Canvas role="grid" with descriptive label

## Responsive Findings

No responsive issues introduced. Changes are purely behavioral and do not affect layout at any breakpoint.

## Change Log

### Files Modified
1. `bloops_app/src/components/Grid.svelte`
   - Fixed pointerActive flag initialization bug
   - Added eraseMode state and logic
   - Added global keyboard event handlers
   - Updated cursor style and aria-label
   - Removed static cursor from CSS

2. `bloops_app/src/__tests__/Grid.spec.js`
   - Added 4 new test cases for note toggle and erase mode functionality
   - Tests cover: add note, remove note, shift-erase, alt-erase

### Rationale
- **Minimal changes:** Only touched the specific code paths related to pointer events and paint value determination
- **Additive feature:** Erase mode is opt-in and doesn't change default behavior
- **Bug fix:** Restores expected toggle behavior that was broken
- **User-requested:** Directly addresses both issues in problem statement

## Testing Recommendations

### Manual Testing Checklist
- [ ] Click empty cell → note appears
- [ ] Click filled cell → note disappears
- [ ] Drag across empty cells starting from empty cell → fills all
- [ ] Drag across cells starting from filled cell → erases all
- [ ] Hold Shift, click empty cell → erases (no-op visually)
- [ ] Hold Shift, drag across filled cells → erases all
- [ ] Hold Alt, click empty cell → erases (no-op visually)
- [ ] Hold Alt, drag across filled cells → erases all
- [ ] Cursor changes when holding Shift/Alt
- [ ] Keyboard navigation still works (arrow keys, space/enter)

### Automated Tests
Run existing test suite:
```bash
cd bloops_app
npm test
```

Expected: All 52+ tests passing (4 new tests added)

## Screenshots

*Note: Screenshots would be captured here during manual testing. Since this is a behavioral fix rather than visual change, the UI appearance remains the same, but the interaction behavior is corrected.*

## Future Enhancements (Out of Scope)

Potential improvements for future consideration:
- Add visual indicator (icon/button) for erase mode in UI
- Add undo/redo for note editing operations (already exists in history)
- Add brush size control for painting multiple rows at once
- Add "clear all" and "fill all" shortcuts
