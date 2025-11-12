# Visual Test Scenarios - Grid Lines Update

## Test Scenario 1: Basic Grid Line Visibility

### Setup
1. Open the Bloops application
2. Select default track (Track 1)
3. Set bars to 2
4. Set note length to 1/16

### Expected Results
- ✅ NO horizontal lines visible across the grid
- ✅ Faint vertical lines at positions: 0, 4, 8, 12, 16, 20, 24, 28, 32
  - These represent 1/4 bar increments (stepsPerBar=16, so every 4 steps)
- ✅ More visible vertical lines at positions: 0, 16, 32
  - These represent full bar boundaries (every 16 steps)
- ✅ Lines use the track color (default: teal/cyan)

### Visual Check
```
More visible (bar)    Faint (quarter)
      ↓                    ↓
      |    |    |    |    |    |    |    |    |
      0    4    8   12   16   20   24   28   32
      ↑                   ↑                   ↑
   Bar 1              Bar 2              Bar 3 start
```

## Test Scenario 2: Different Note Lengths

### Test 2a: 1/64 Note Length
1. Set note length to 1/64
2. Set bars to 1 (16 steps total)

**Expected:**
- Grid displays 64 columns (16 steps × 4 resolution)
- Quarter-bar lines at columns: 0, 16, 32, 48, 64 (every 16 columns = 4 logical steps)
- Bar line at column 0 only (start of bar)

### Test 2b: 1/32 Note Length
1. Set note length to 1/32
2. Set bars to 2

**Expected:**
- Grid displays 64 columns (32 steps × 2 resolution)
- Quarter-bar lines every 8 columns (representing 4 logical steps)
- Bar lines at columns: 0, 32 (every 16 logical steps)

### Test 2c: 1/8 Note Length
1. Set note length to 1/8
2. Set bars to 4

**Expected:**
- Grid displays 32 columns (64 steps ÷ 2 grouping)
- Quarter-bar lines every 2 columns
- Bar lines at columns: 0, 8, 16, 24, 32

## Test Scenario 3: Track Color Integration

### Setup
1. Create multiple tracks with different colors
2. Switch between tracks

### Expected Results
- ✅ Grid lines change color based on active track
- ✅ Quarter-bar lines maintain 0.10 opacity regardless of track color
- ✅ Bar lines maintain 0.28 opacity regardless of track color
- ✅ Color blends naturally with grid background

### Test Colors
- Track 1 (default teal): `#78d2b9`
- Track 2 (custom red): `#ff5555`
- Track 3 (custom blue): `#5555ff`
- Track 4 (custom yellow): `#ffff55`

## Test Scenario 4: Component Width Alignment

### Setup
1. Open application in desktop viewport (1920×1080)
2. Scroll to view both TrackControls and TrackEffectsPanel sections

### Visual Alignment Check
```
┌─────────────────────────────────────────────────────┐
│  Track Controls                                      │
│  ├─ Track name (with color picker)                  │
│  ├─ Waveform selector                               │
│  ├─ Scale selector                                  │
│  └─ Root note selector                              │
└─────────────────────────────────────────────────────┘
          ↕ 20px margin
┌─────────────────────────────────────────────────────┐
│  Sound shaping                                       │
│  ├─ Effects toggle buttons                          │
│  └─ Knob controls grid                              │
└─────────────────────────────────────────────────────┘
```

### Expected Results
- ✅ Left edges align perfectly
- ✅ Right edges align perfectly
- ✅ Both sections have same horizontal padding (24px)
- ✅ Vertical spacing between sections is 20px
- ✅ No overflow or horizontal scroll

## Test Scenario 5: Responsive Width Alignment

### Test at Different Viewports

#### Desktop (1920×1080)
- ✅ Both sections span full width with 24px padding on each side

#### Tablet (768×1024)
- ✅ Both sections maintain alignment
- ✅ Components within sections may wrap but containers align

#### Mobile (375×667)
- ✅ Both sections still align
- ✅ No horizontal overflow

## Test Scenario 6: Grid Interaction (No Regression)

### Setup
1. Open application with grid lines changed
2. Try to add notes by clicking on grid cells

### Expected Results
- ✅ Clicking on grid cells adds/removes notes correctly
- ✅ Note dots render in center of cells
- ✅ Playhead animation works smoothly
- ✅ Hover states work correctly
- ✅ Keyboard navigation (arrow keys) works
- ✅ Focus indicator appears correctly

## Test Scenario 7: Effects Panel Functionality (No Regression)

### Setup
1. Open Effects or ADSR Envelope panel
2. Adjust various controls

### Expected Results
- ✅ Panel toggles work correctly
- ✅ Knob controls respond to interaction
- ✅ Value displays update correctly
- ✅ Audio reflects changes in real-time
- ✅ No layout shifts when toggling panels

## Test Scenario 8: Edge Cases

### Test 8a: Very Small Bar Count (1 bar)
**Setup:** bars=1, stepsPerBar=16, note=1/16
**Expected:** 
- 4 quarter-bar lines (at 0, 4, 8, 12)
- 1 bar line (at 0, coincides with first quarter-bar)
- Total 16 columns displayed

### Test 8b: Very Large Bar Count (8 bars)
**Setup:** bars=8, stepsPerBar=16, note=1/16
**Expected:**
- Quarter-bar lines every 4 columns
- Bar lines at: 0, 16, 32, 48, 64, 80, 96, 112, 128
- Grid scrolls horizontally if needed

### Test 8c: Non-Standard Steps Per Bar
**Setup:** bars=2, stepsPerBar=12 (3/4 time), note=1/16
**Expected:**
- Quarter-bar lines every 3 columns (12÷4=3)
- Bar lines at: 0, 12, 24

## Test Scenario 9: Performance Check

### Setup
1. Open browser DevTools Performance tab
2. Record while interacting with grid

### Expected Results
- ✅ Canvas drawing completes in < 16ms (60fps)
- ✅ No memory leaks during extended use
- ✅ Smooth playhead animation at 60fps
- ✅ Responsive to user input

## Test Scenario 10: Accessibility (No Regression)

### Keyboard Navigation
- ✅ Tab focuses on grid
- ✅ Arrow keys navigate cells
- ✅ Space/Enter toggles notes
- ✅ Focus indicator visible

### Screen Reader
- ✅ Grid announces as "Note grid"
- ✅ Instructions audible ("use arrow keys to navigate")
- ✅ Changes announced appropriately

## Test Checklist Summary

### Visual Tests
- [ ] No horizontal lines visible
- [ ] Faint vertical lines at quarter-bars (opacity ~0.10)
- [ ] Visible vertical lines at bars (opacity ~0.28)
- [ ] Lines use track color
- [ ] TrackControls and TrackEffectsPanel widths match

### Functional Tests
- [ ] Grid interaction works (click to add/remove notes)
- [ ] Different note lengths display correctly
- [ ] Different bar counts display correctly
- [ ] Playhead animation smooth
- [ ] Effects panel functions correctly

### Responsive Tests
- [ ] Desktop (1920×1080)
- [ ] Tablet (768×1024)
- [ ] Mobile (375×667)

### Regression Tests
- [ ] All existing features work
- [ ] No console errors
- [ ] No visual glitches
- [ ] Performance remains good

### Edge Cases
- [ ] 1 bar
- [ ] 8+ bars
- [ ] Non-standard steps per bar
- [ ] Rapid track switching

## Pass/Fail Criteria

### PASS if:
- All visual tests show expected grid lines
- Width alignment is pixel-perfect
- No functional regressions
- Performance remains smooth

### FAIL if:
- Horizontal lines still visible
- Bar/quarter-bar lines incorrect
- Width misalignment > 2px
- Any broken functionality
- Performance degradation

## Reporting Results

After testing, document:
1. Browser and version tested
2. Operating system
3. Screen resolution
4. Screenshot of grid with annotations
5. Any issues found
6. Overall pass/fail status

---

**Note:** All tests should be performed on a clean browser session to avoid cached assets affecting results.
