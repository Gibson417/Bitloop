# Theme Canvas Update Fix - Visual Flow Diagram

## Problem Flow (Before Fix)

```
┌─────────────────────────────────────────────────────────────┐
│                     User Action                              │
│                                                              │
│  User clicks Settings → Selects new theme (e.g., "Ocean")   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  ThemeSelector.svelte                        │
│                                                              │
│  handleThemeChange() → theme.setTheme('ocean')              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   themeStore.js                              │
│                                                              │
│  applyTheme('ocean'):                                       │
│  1. Updates CSS custom properties on :root                  │
│     --color-accent: #4ec9e0                                 │
│     --color-note-active: #6b8fff                            │
│     --color-background: #0d1b24                             │
│     etc.                                                     │
│  2. Updates document.body background                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  UI Components                               │
│                                                              │
│  ✅ All other components update immediately                 │
│     (they use CSS properties directly in styles)            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Grid.svelte                               │
│                                                              │
│  ❌ Canvas does NOT redraw because:                         │
│     - drawTrigger reactive object doesn't include theme     │
│     - CSS properties updated but no Svelte reactivity       │
│     - draw() only called when notes/playhead/etc change     │
│                                                              │
│  Result: Old theme colors remain on canvas                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  User Clicks Note                            │
│                                                              │
│  → Triggers notechange event                                │
│  → Updates 'notes' prop                                     │
│  → drawTrigger updates                                      │
│  → Canvas finally redraws with new theme! ✅                │
└─────────────────────────────────────────────────────────────┘
```

---

## Solution Flow (After Fix)

```
┌─────────────────────────────────────────────────────────────┐
│                     User Action                              │
│                                                              │
│  User clicks Settings → Selects new theme (e.g., "Ocean")   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  ThemeSelector.svelte                        │
│                                                              │
│  handleThemeChange() → theme.setTheme('ocean')              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   themeStore.js                              │
│                                                              │
│  applyTheme('ocean'):                                       │
│  1. Updates store value: 'ocean'  ← BROADCASTS TO SUBSCRIBERS
│  2. Updates CSS custom properties on :root                  │
│     --color-accent: #4ec9e0                                 │
│     --color-note-active: #6b8fff                            │
│     --color-background: #0d1b24                             │
│     etc.                                                     │
│  3. Updates document.body background                        │
└─────────────────────────────────────────────────────────────┘
                            │
                   ┌────────┴────────┐
                   │                 │
                   ▼                 ▼
    ┌──────────────────┐   ┌──────────────────┐
    │  UI Components   │   │   Grid.svelte    │
    │                  │   │                  │
    │  ✅ Update       │   │  ✅ NEW BEHAVIOR │
    │  immediately     │   └──────────────────┘
    └──────────────────┘            │
                                    ▼
              ┌─────────────────────────────────────────────┐
              │  Grid.svelte Theme Subscription (NEW!)     │
              │                                            │
              │  const unsubscribeTheme = theme.subscribe( │
              │    (value) => { currentTheme = value }    │
              │  )                                         │
              │                                            │
              │  → currentTheme changes to 'ocean'        │
              └─────────────────────────────────────────────┘
                                    │
                                    ▼
              ┌─────────────────────────────────────────────┐
              │  Svelte Reactivity Chain                   │
              │                                            │
              │  $: drawTrigger = {                        │
              │    notes,                                  │
              │    playheadStep,                           │
              │    ...                                     │
              │    currentTheme  ← TRIGGERS UPDATE!        │
              │  }                                         │
              └─────────────────────────────────────────────┘
                                    │
                                    ▼
              ┌─────────────────────────────────────────────┐
              │  Canvas Redraw                             │
              │                                            │
              │  $: if (ctx) {                             │
              │    drawTrigger;  ← DEPENDENCY CHANGED      │
              │    draw();       ← CALLED AUTOMATICALLY!   │
              │  }                                         │
              │                                            │
              │  → draw() calls getStyles()                │
              │  → getStyles() reads updated CSS vars      │
              │  → Canvas painted with new Ocean theme! ✅ │
              └─────────────────────────────────────────────┘
                                    │
                                    ▼
              ┌─────────────────────────────────────────────┐
              │             Result                          │
              │                                            │
              │  ✅ Immediate visual update                │
              │  ✅ Consistent UX across all UI            │
              │  ✅ No user interaction needed             │
              └─────────────────────────────────────────────┘
```

---

## Key Changes Visualized

### Before Fix
```javascript
// Grid.svelte (lines 457-466)
$: drawTrigger = {
  notes,
  playheadStep,
  playheadProgress,
  trackColor,
  isPlaying,
  stepsPerBar,
  noteLengthSteps,
  columns,
  rows
  // ❌ NO theme dependency!
};
```

### After Fix
```javascript
// Grid.svelte (lines 38-42)
// NEW: Subscribe to theme changes
let currentTheme;
const unsubscribeTheme = theme.subscribe((value) => {
  currentTheme = value;
});

// Grid.svelte (lines 465-476)
$: drawTrigger = {
  notes,
  playheadStep,
  playheadProgress,
  trackColor,
  isPlaying,
  stepsPerBar,
  noteLengthSteps,
  columns,
  rows,
  currentTheme  // ✅ Theme changes now trigger redraw!
};

// Grid.svelte (lines 457-463)
// NEW: Clean up subscription
onDestroy(() => {
  if (resizeObserver && scroller) {
    resizeObserver.unobserve(scroller);
    resizeObserver.disconnect();
  }
  unsubscribeTheme?.();  // ✅ Proper cleanup
});
```

---

## Reactivity Chain Explained

```
theme.setTheme('ocean')
  ↓
theme store value changes from 'dark' → 'ocean'
  ↓
Grid's subscription callback fires
  ↓
currentTheme = 'ocean'
  ↓
Svelte detects currentTheme changed
  ↓
drawTrigger object updates (new reference)
  ↓
Reactive statement watching drawTrigger fires
  ↓
draw() function called
  ↓
getStyles() reads updated CSS properties
  ↓
Canvas rendered with new theme colors!
```

---

## Test Verification

```javascript
// Grid.spec.js (new test)
it('redraws canvas when theme changes', async () => {
  // 1. Render Grid component
  const { container } = render(Grid, { props: {...} });
  
  // 2. Spy on canvas drawing methods
  const fillRectSpy = vi.spyOn(ctx, 'fillRect');
  fillRectSpy.mockClear();
  
  // 3. Change theme
  theme.setTheme('light');
  await new Promise(resolve => setTimeout(resolve, 10));
  
  // 4. Verify redraw occurred
  expect(fillRectSpy.mock.calls.length).toBeGreaterThan(0); ✅
});
```

---

## Impact Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Theme Change** | Delayed until interaction | ✅ Immediate |
| **User Experience** | Inconsistent, confusing | ✅ Smooth, polished |
| **Code Complexity** | N/A | +4 lines (minimal) |
| **Performance** | N/A | No overhead |
| **Memory** | N/A | Properly managed |
| **Test Coverage** | No specific test | ✅ Dedicated test |

---

## All 8 Themes Supported

The fix automatically works with all existing themes:

1. ✅ Dark (default)
2. ✅ Light
3. ✅ Classic
4. ✅ Sunset
5. ✅ Ocean
6. ✅ Forest
7. ✅ Cyberpunk
8. ✅ Monochrome

No additional code needed for future themes either - they'll work automatically!

---

**Visual Guide Created**: 2025-11-12  
**Status**: ✅ Complete and verified
