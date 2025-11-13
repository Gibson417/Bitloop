# Visual Testing Guide - Grid Window Switcher

## Test Setup

1. Start the development server:
   ```bash
   cd bloops_app
   npm install --legacy-peer-deps
   npm run dev
   ```

2. Open browser to `http://localhost:5173`

## Visual Test Cases

### 1. Window Switcher Component Appearance

**Expected Result:**
- Window switcher appears in grid toolbar, right-aligned
- Contains: Previous button | Dot indicators | Next button
- Buttons are 44×44px with rounded corners
- Indicators show current window highlighted

**Test Steps:**
1. Create a project with 4 bars (to have multiple windows)
2. Observe the window switcher in the grid toolbar
3. Verify layout matches design

---

### 2. Grid Line Contrast Improvement

**Expected Result:**
- Bar lines (at 16-step intervals) are more visible with ~0.55 opacity
- Quarter-bar lines visible with white color at ~0.18 opacity
- Lines should be clearly distinguishable for rhythm reading

**Test Steps:**
1. Zoom in on grid
2. Observe vertical lines at different intervals
3. Compare bar boundaries (thick, more visible) vs beat lines (thinner, less visible)

**Before/After Comparison:**
- Before: Bar lines at 0.35 opacity (too subtle)
- After: Bar lines at 0.55 opacity (better visibility)

---

### 3. Consecutive Note Placement

**Expected Result:**
- Clicking same grid cell repeatedly toggles note on/off
- No need to release mouse between clicks
- Each click should add or remove note

**Test Steps:**
1. Click an empty cell - note appears
2. Click same cell again immediately - note disappears
3. Click same cell again - note appears
4. Repeat several times to verify consistent toggle behavior

**Bug Fixed:**
Previously, consecutive clicks would not work because `paintedCells` Set prevented same cell from being modified during what it thought was a single gesture.

---

### 4. Empty Space Fix

**Expected Result:**
- Grid wrapper fits content width
- No unnecessary empty space to right of grid
- Container size matches visible 16 columns

**Test Steps:**
1. Open app with default project
2. Observe grid container
3. Verify no large empty area to right of canvas

**Before/After:**
- Before: `flex: 1` caused grid to expand to fill container
- After: `flex: 0 1 auto` + `width: fit-content` sizes to canvas

---

### 5. Window Navigation Functionality

**Expected Result:**
- Clicking next button advances to next window
- Clicking previous button goes back
- Clicking dot indicator jumps to that window
- Playhead stays visible in current window

**Test Steps:**
1. Create project with 4+ bars (multiple windows)
2. Start playback
3. Click "Next window" button
4. Verify grid shows next 16 steps
5. Click "Previous window" button
6. Verify grid shows previous 16 steps
7. Click a dot indicator
8. Verify grid jumps to that window

---

### 6. Follow Mode Interaction

**Expected Result:**
- When follow mode is ON, grid auto-follows playhead
- Clicking window switcher disables follow mode
- Re-enabling follow mode clears manual window override

**Test Steps:**
1. Start playback with follow mode ON
2. Observe grid following playhead automatically
3. Click "Next window" button
4. Verify follow mode pill changes to "Not following"
5. Click follow toggle to re-enable
6. Verify grid resumes auto-following playhead

---

### 7. Responsive Layout - Desktop

**Expected Result:**
- Window switcher appears right-aligned in toolbar
- Note length selector on left, window switcher on right
- All elements fit comfortably at 1440px width

**Test Steps:**
1. Resize browser to 1440px width
2. Observe grid toolbar layout
3. Verify horizontal spacing

---

### 8. Responsive Layout - Mobile

**Expected Result:**
- Window switcher takes full width on mobile
- Centered horizontally
- Buttons reduce to 40×40px (still ≥ minimum)
- Indicators remain accessible

**Test Steps:**
1. Resize browser to 375px width (iPhone SE)
2. Observe window switcher layout
3. Verify touch targets are accessible

---

### 9. Keyboard Accessibility

**Expected Result:**
- Tab key navigates: Note Length → Prev Button → Indicators → Next Button → Grid
- Enter/Space activates buttons
- Focus rings visible on all elements
- Arrow keys navigate grid (existing functionality)

**Test Steps:**
1. Click in browser address bar (to reset focus)
2. Press Tab repeatedly
3. Verify focus order
4. Use Enter/Space to activate controls
5. Verify focus indicators are clearly visible

---

### 10. Touch Target Compliance

**Expected Result:**
- All buttons meet minimum 44×44px touch target (WCAG 2.2 AA)
- Window nav buttons: 44×44px on desktop, 40×40px on mobile
- Indicators: 10px base, but with sufficient padding around them

**Test Steps:**
1. Use Chrome DevTools mobile emulation
2. Enable "Show rulers" and "Show device frame"
3. Measure button dimensions
4. Verify all interactive elements ≥ 44×44px (or 40×40px on mobile)

---

## Automated Test Execution

Run automated tests to verify functionality:

```bash
cd bloops_app
npm run test:run
```

Expected output:
- All existing tests pass
- New WindowSwitcher tests pass (11 new tests)
- Total: ~63+ passing tests

---

## Performance Validation

### Window Switching Performance

**Test:**
1. Create project with 8 bars (16 windows)
2. Rapidly click through all windows
3. Monitor frame rate in Chrome DevTools

**Expected:**
- No frame drops
- Smooth transitions
- No memory leaks

### Grid Rendering Performance

**Test:**
1. Create project with maximum bars
2. Enable window switching
3. Monitor render time for each window

**Expected:**
- Grid renders in <16ms (60fps)
- No jank during playback

---

## Accessibility Audit

Use Chrome Lighthouse to verify:

```bash
# Run Lighthouse audit
# Target: http://localhost:5173
# Category: Accessibility
```

**Expected Score:** ≥ 95/100

**Key Checks:**
- ✅ Contrast ratios meet WCAG AA
- ✅ Touch targets ≥ 44×44px
- ✅ Proper ARIA labels
- ✅ Keyboard navigation
- ✅ Focus indicators

---

## Notes

- All test screenshots should be taken at 1440×900 resolution (desktop)
- Mobile screenshots at 375×667 resolution (iPhone SE)
- Use consistent test data (same project file) for reproducibility
