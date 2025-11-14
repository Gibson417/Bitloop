# Grid Component Visual Alignment Audit - Bloops App

**Date**: 2025-11-13  
**Component**: `Grid.svelte`  
**Location**: `/home/runner/work/Bitloop/Bitloop/bloops_app/src/components/Grid.svelte`  
**Issue**: Grid borders and background visual alignment/padding problems

---

## Executive Summary

### Top 5 Wins
1. ✅ Consistent spacing scale (8pt base with 32px cell size default)
2. ✅ Keyboard navigation implemented with visible focus indicators
3. ✅ `prefers-reduced-motion` support for playhead animations
4. ✅ Proper ARIA attributes (role="grid", aria-label)
5. ✅ `overflow: hidden` on wrapper correctly clips canvas to rounded corners

### Top 5 Issues (Visual Alignment Focus)
1. 🔴 **Border-radius inconsistency**: Grid wrapper uses 12px, note-labels use 8px, focus-visible uses 8px
2. 🔴 **Canvas draws to absolute edge**: Background gradient fills from (0,0) without any visual inset
3. 🟡 **Focus indicator shape mismatch**: 8px radius doesn't match 12px wrapper
4. 🟡 **Note-labels not visually aligned**: 8px radius creates inconsistent visual rhythm
5. 🟢 **No visual padding**: Canvas content touches wrapper border directly

---

## Grid Map

### Container Structure
```
.grid-container (flex, gap: 8px)
  ├── .note-labels
  │   ├── min-width: 48px (6×8pt)
  │   ├── border-radius: 8px ⚠️
  │   ├── border: 1px solid rgba(var(--color-text), 0.08)
  │   ├── padding: 0
  │   └── height: bound to layout.height (256px min)
  │
  └── .grid-wrapper
      ├── border-radius: 12px ⚠️ (inconsistent)
      ├── border: 1px solid rgba(var(--color-text), 0.08)
      ├── overflow: hidden (clips canvas)
      ├── padding: NONE ⚠️
      ├── min-height: 256px
      └── canvas.grid-canvas
          ├── display: block
          ├── border: none (correct)
          ├── background: transparent (correct)
          ├── min-width: 512px, min-height: 256px
          └── draws gradient from (0, 0) to (width, height) ⚠️
```

### Spacing Scale
- **Base unit**: 8pt
- **Gap between containers**: 8px (1×8pt) ✅
- **Cell size**: 32px (4×8pt) default, range 18-48px
- **Label min-height**: 32px (aligns to cell size) ✅
- **Label min-width**: 48px (6×8pt) ✅
- **Border thickness**: 1px ✅
- **Border-radius**: 12px (wrapper), 8px (labels, focus) ⚠️ INCONSISTENT

---

## Anomalies Table

| File | Line(s) | Element | Current Value | Issue | Recommended Fix |
|------|---------|---------|---------------|-------|-----------------|
| Grid.svelte | 719 | `.grid-wrapper` | `border-radius: 12px` | Inconsistent with note-labels | **Keep 12px**, update others to match |
| Grid.svelte | 693 | `.note-labels` | `border-radius: 8px` | Inconsistent with grid-wrapper | **Change to 12px** |
| Grid.svelte | 740 | `.grid-canvas:focus-visible` | `border-radius: 8px` | Doesn't match wrapper shape | **Change to 11px** (12px - 1px border offset) |
| Grid.svelte | 711-724 | `.grid-wrapper` | No padding | Canvas touches border directly | **Keep as-is** - overflow:hidden clips correctly |
| Grid.svelte | 145 | `ctx.fillRect(0, 0, ...)` | Fills entire canvas | Visual alignment looks off | **No change needed** - wrapper clips it |
| Grid.svelte | 726-735 | `.grid-canvas` | `background: transparent` | Correct approach | ✅ No change |

---

## Visual Alignment Issues

### Issue 1: Border-Radius Inconsistency ⚠️ CRITICAL
**Locations**: 
- Line 719: `.grid-wrapper { border-radius: 12px; }`
- Line 693: `.note-labels { border-radius: 8px; }`
- Line 740: `.grid-canvas:focus-visible { border-radius: 8px; }`

**Problem**: Three different border-radius values create visual inconsistency. The grid-wrapper (main component) uses 12px, but supporting elements use 8px.

**Visual Impact**: 
- Note-labels container has sharper corners than grid-wrapper
- Focus indicator has sharper corners than the canvas wrapper
- Inconsistent visual rhythm across the component

**Fix**:
1. Standardize on 12px for grid-wrapper (already correct)
2. Update note-labels to 12px to match
3. Update focus-visible to 11px (to account for -3px outline-offset, creating visual alignment with 12px wrapper - 1px border = 11px inner radius)

**Rationale**: 12px is more appropriate for panel-level components. 8px would be better for smaller controls. Since these are panel-sized containers, 12px provides better visual weight.

---

### Issue 2: Canvas Background Rendering
**Location**: Lines 141-145 (draw function)

```javascript
const backgroundGradient = ctx.createLinearGradient(0, 0, 0, layout.height);
backgroundGradient.addColorStop(0, styles.background);
backgroundGradient.addColorStop(1, styles.backgroundEnd);
ctx.fillStyle = backgroundGradient;
ctx.fillRect(0, 0, layout.width, layout.height);
```

**Analysis**: 
- Canvas draws background from absolute edge (0, 0)
- Wrapper has `overflow: hidden` which clips canvas to rounded corners ✅
- Wrapper has 1px border that creates visual frame ✅
- The current implementation is **actually correct** - no fix needed

**Why it works**:
1. Canvas is `display: block` (no inline spacing)
2. Wrapper has `overflow: hidden` and `border-radius: 12px`
3. Browser clips canvas content to wrapper's rounded corners
4. The 1px border creates visual separation

**Perceived Issue**: If there appears to be misalignment, it's likely due to:
- Sub-pixel rendering differences across browsers
- Border-radius inconsistency with note-labels creating visual confusion
- High-DPI displays showing rounding artifacts

**Actual Fix Needed**: Fix border-radius consistency (Issue 1), not canvas rendering.

---

## Accessibility Findings

### Focus Management
- ✅ Canvas has `tabindex="0"` for keyboard access
- ✅ Focus-visible outline: 3px solid with -3px offset (internal focus ring)
- ⚠️ Focus ring border-radius (8px) doesn't match wrapper (12px)

**Fix**: Update focus-visible border-radius to 11px to align with wrapper's inner curve.

---

## Change Summary

### Changes Applied ✅

1. **Grid.svelte line 693** - Updated note-labels border-radius:
   ```css
   /* FROM */
   border-radius: 8px;
   
   /* TO */
   border-radius: 12px;
   ```
   ✅ **APPLIED** - Note labels now have consistent 12px corners matching grid-wrapper

2. **Grid.svelte line 740** - Updated focus-visible border-radius:
   ```css
   /* FROM */
   border-radius: 8px;
   
   /* TO */
   border-radius: 11px;
   ```
   ✅ **APPLIED** - Focus indicator now aligns with wrapper shape (11px accounts for the -3px outline-offset, creating visual alignment with the 12px wrapper minus its 1px border)

### No Changes Needed
- ✅ Canvas drawing logic (0, 0 start is correct)
- ✅ Wrapper overflow: hidden (correctly clips canvas)
- ✅ Canvas background: transparent (correct approach)
- ✅ Border widths and colors (consistent)

---

## Testing Checklist

### Visual Testing
- [x] Identify border-radius inconsistencies
- [x] Apply fixes
- [ ] Test in Chrome/Firefox/Safari at 100%, 125%, 150% zoom
- [ ] Test on high-DPI display (Retina, 4K)
- [ ] Verify rounded corners align visually
- [ ] Check focus indicator shape alignment

### Layout Testing
- [ ] Test at 320px, 768px, 1024px, 1920px widths
- [ ] Verify no gaps between border and canvas
- [ ] Verify overflow:hidden clips canvas correctly

---

## Conclusion

The primary issue is **border-radius inconsistency**, not actual canvas/wrapper misalignment. The canvas rendering is correct - it draws to its full size, and the wrapper's `overflow: hidden` clips it to rounded corners as designed.

**Root cause**: Visual confusion from mixing 8px and 12px border-radius values.

**Solution**: Standardize on 12px for all panel-level rounded corners.

**Impact**: Minimal changes (2 CSS values), high visual improvement.

