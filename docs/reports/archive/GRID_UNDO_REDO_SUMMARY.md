# Grid-Specific Undo/Redo Implementation Summary

## Overview
Implemented separate undo/redo functionality for grid (note) operations that is independent of other project changes like BPM, bars, track settings, etc.

## Changes Made

### 1. projectStore.js
- **Added grid-specific history tracking**:
  - Created `gridHistoryStatusStore` to track grid undo/redo availability
  - Added `toGridSnapshot()` helper to capture only track notes data
  - Implemented separate `gridHistoryPast` and `gridHistoryFuture` arrays
  - Added `pushGridHistory()` to track grid-only changes
  - Added `applyGridSnapshot()` to restore grid-only state

- **Updated note modification functions**:
  - Modified `applyNoteRange()` to push to both global and grid history
  - Modified `applyNoteRangeStorage()` to push to both global and grid history
  - These ensure note changes are tracked in grid-specific history

- **Added new grid-specific methods**:
  - `gridUndo()` - Undo only grid/note changes
  - `gridRedo()` - Redo only grid/note changes
  - These methods operate independently of the global undo/redo

- **Exported new store**:
  - `export const gridHistoryStatus` - Observable for grid undo/redo state

### 2. App.svelte
- **Updated imports**:
  - Added `gridHistoryStatus` import from projectStore
  - Added `gridHistoryState` reactive variable

- **Updated handlers**:
  - Changed `handleUndo()` to call `project.gridUndo()` instead of `project.undo()`
  - Changed `handleRedo()` to call `project.gridRedo()` instead of `project.redo()`

- **Updated reactive declarations**:
  - Changed `canUndo` to use `gridHistoryState?.canUndo` instead of `historyState?.canUndo`
  - Changed `canRedo` to use `gridHistoryState?.canRedo` instead of `historyState?.canRedo`

### 3. Tests
- **Created projectStore.grid-undo.spec.js** with comprehensive tests:
  - Grid undo/redo only affects note changes, not other settings
  - Grid undo/redo is independent of global undo/redo
  - Non-grid changes do not affect grid undo/redo history
  - Grid undo/redo handles multiple note changes correctly
  - Grid history is cleared when loading a new project
  - Grid undo preserves track settings while undoing notes

## Behavior

### Before this change:
- Clicking undo/redo in the grid toolbar would undo ALL changes (BPM, bars, track settings, notes, etc.)
- This was confusing because the toolbar is visually part of the grid

### After this change:
- Clicking undo/redo in the grid toolbar only affects note placements/removals
- Other changes like BPM, bars, track settings, etc. are NOT affected by grid undo/redo
- Global undo/redo (if needed in the future) remains available via the project store

## Example Usage Scenario

1. User places some notes on the grid
2. User changes BPM from 120 to 140
3. User places more notes on the grid
4. User clicks "Undo" in grid toolbar → Last note placement is undone, BPM stays at 140
5. User clicks "Undo" again → First note placement is undone, BPM stays at 140
6. User clicks "Redo" → First note placement is restored, BPM stays at 140

## Technical Details

- Grid history is maintained separately from global history
- Both histories continue to track changes independently
- Grid history only stores track note data (the 2D boolean arrays)
- When applying grid undo/redo, only the notes are restored; all other state is preserved
- Grid history is cleared when loading a new project
- Maximum history length is 100 entries (same as global history)

## Testing

All existing tests pass (except 2 pre-existing unrelated failures).
New test suite added with 6 comprehensive tests covering all edge cases.

Build: ✅ Successful
Tests: ✅ 131 passed (2 pre-existing failures unrelated to this change)
