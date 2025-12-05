# Pull Request #120 Analysis and Recommendation

## Executive Summary

**RECOMMENDATION: Close PR #120 and create a new PR with fresh changes**

PR #120 is **not mergeable** due to conflicts, and the fix needs to be reapplied on top of the current main branch with the recent changes incorporated.

---

## Problem Statement

PR #120 attempts to fix a real bug where:
- The application has `ZoomControls` component that controls `zoomLevel` prop
- `zoomLevel` is passed to the Grid component
- **BUT** the Grid component ignores `zoomLevel` and uses `noteLengthDenominator` instead for grid resolution
- This means the Zoom buttons (+/-) don't actually work - they change the value but Grid doesn't use it

## Current Situation

### What PR #120 Does (Correctly)
- Separates zoom from note length in Grid.svelte
- Uses `zoomLevel` for grid resolution (how fine/coarse the grid cells are)
- Uses `noteLengthDenominator` for note span (how long each note is)
- Updates test to verify `zoomLevel` controls grid layout

### Why It Can't Merge
PR #120 has **merge conflicts** with main because:

1. **Incompatible Code Changes**: PR #120 changes lines 107-110, 148-157, 176-179, 382-390, 409-467, 507-515, 549-560 in Grid.svelte
2. **Main Branch Reverted the Approach**: Between when PR #120 was created and now, other PRs (especially #117, #119, #121) modified the same code sections in incompatible ways
3. **Different Implementation Strategy**: Main now handles note length differently with the `drawingTool` and `extendMode` features
4. **Divergent History**: The branches have completely different commit histories with no clean common ancestor

### Key Conflicts
- **Line ~110**: PR #120 uses `zoom` variable, main uses `denom` variable
- **Line ~150**: PR #120 calculates `displayColumns` from `zoomLevel`, main uses `noteLengthDenominator`
- **Line ~410**: PR #120 separates note length calculation, main has integrated it with draw tool logic
- **Multiple functions**: `updateLayout()`, `draw()`, `handlePointer()`, `handleKeyDown()` all have conflicts

## Technical Details

### Current Main Branch State (commit 10ac681)
- ✅ Has `zoomLevel` prop defined (line 22)
- ❌ Never uses `zoomLevel` in any calculations
- ❌ Uses `noteLengthDenominator` for BOTH grid resolution AND note span
- ✅ Has enhanced drawing tool features (`extendMode`, `drawingTool`)
- ✅ Has accessibility improvements
- ✅ Tests passing (86/87)

### PR #120 Branch State (commit 3ac569e)  
- ✅ Uses `zoomLevel` for grid resolution calculations
- ✅ Uses `noteLengthDenominator` for note span only
- ⚠️ Has older versions of drawing tool features
- ⚠️ Missing some accessibility improvements from main
- ❌ Cannot merge due to conflicts in 3 files:
  - `unknown_app/src/components/Grid.svelte`
  - `unknown_app/src/__tests__/Grid.layout.spec.js`
  - `MERGE_RESOLUTION.md`

## Why This Matters

The bug PR #120 fixes is **still present in main**:
```javascript
// In ZoomControls.svelte - user clicks zoom buttons
handleZoomIn() {
  dispatch('zoom', { level: VALID_RESOLUTIONS[currentIndex + 1] });
}

// In App.svelte - zoomLevel gets updated
const handleZoomChange = (event) => {
  zoomLevel = event.detail.level;
};

// In Grid.svelte - zoomLevel is IGNORED! Uses noteLengthDenominator instead
const denom = Number(noteLengthDenominator) || null;
const displayColumns = denom && Number.isFinite(denom) && denom > 0
  ? Math.max(1, Math.floor((logicalColumns * denom) / stepsPerBarSafe))
  : // ... fallback logic
```

This means:
- Users see zoom controls in the UI
- Clicking them does nothing because Grid ignores the `zoomLevel` prop
- The intended separation between "grid resolution" (zoom) and "note length" (span) doesn't work

## Recommendations

### Option 1: Close PR #120 and Create New PR (RECOMMENDED)
**Best approach for clean history and maintainability**

1. ✅ Close PR #120 with explanation that it has unresolvable conflicts
2. ✅ Create a new branch from current main
3. ✅ Apply the zoom/note-length separation fix fresh
4. ✅ Ensure compatibility with latest drawing tool features
5. ✅ Update tests to verify both zoom AND note length work independently
6. ✅ Test that ZoomControls buttons actually work

**Pros:**
- Clean linear history
- No conflict resolution needed
- Can incorporate latest main branch improvements
- Easier to review and understand

**Cons:**
- Loses the history/discussion in PR #120 (but can reference it)
- Requires re-writing the changes

### Option 2: Force-Rebase PR #120 (NOT RECOMMENDED)
**Complex and risky**

1. ⚠️ Rebase PR #120 branch onto current main
2. ⚠️ Manually resolve all conflicts
3. ⚠️ Force-push to update PR

**Pros:**
- Preserves PR number and discussion history

**Cons:**
- Very complex conflict resolution required
- Risk of introducing bugs during manual conflict resolution
- Force-push required (rewrites history)
- Still results in modified PR, harder to review what changed

### Option 3: Close PR #120 Without Fix (NOT RECOMMENDED)
**Leaves the bug unfixed**

**Pros:**
- Simplest immediate action

**Cons:**
- Zoom controls remain broken
- Users expect zoom to work but it doesn't
- Technical debt remains

## Conclusion

**Action Item:** Close PR #120 with a comment explaining:
1. The PR addresses a real bug (zoom controls not working)
2. However, it has unresolvable merge conflicts with main
3. The fix should be re-implemented in a new PR based on current main
4. Reference this analysis document

**Next Step:** Create a new issue or PR to properly implement the zoom/note-length separation on top of the current main branch, preserving all the recent improvements while fixing the zoom functionality.

---

## Related PRs
- PR #117: Added drawing tool functionality
- PR #119: Fixed merge conflicts  
- PR #120: Attempted to separate zoom and note length (this PR)
- PR #121: Documentation of merge resolution

## Files to Fix in New PR
- `unknown_app/src/components/Grid.svelte` - Use `zoomLevel` for grid resolution
- `unknown_app/src/__tests__/Grid.layout.spec.js` - Test that zoom works independently
- Update any documentation about zoom vs note length behavior
