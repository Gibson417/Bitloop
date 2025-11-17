# Development Mode Feature

## Overview
A toggle-able development mode that displays component names in a fixed tooltip box to help identify and describe different screen components.

## Usage

### Enable/Disable Dev Mode
- **Keyboard Shortcut**: Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac)
- A yellow indicator "DEV MODE" will appear at the top of the screen when enabled

### Component Labels
When dev mode is enabled:
- Hover over any UI component (including buttons and controls)
- A fixed orange tooltip box appears in the **bottom-right corner** of the screen
- The tooltip displays the component name you're currently hovering over
- Labels never overlap since they're shown in a single fixed location
- Uses a monospace font for clarity

## Implementation Details

### Files Created
- `src/store/devModeStore.js` - Svelte store for managing dev mode state
  - Persists state to localStorage
  - Provides `toggle()`, `enable()`, and `disable()` methods

### Files Modified
- `src/App.svelte` - Main app component
  - Added dev mode import and subscription
  - Added keyboard shortcut handler (Ctrl+Shift+D)
  - Added dev mode indicator UI (top center)
  - Added fixed tooltip box in bottom-right corner
  - Added global mouseover event listener to track hovered components
  - Replaced CSS pseudo-element tooltips with fixed tooltip box
  - Added `data-component` attributes to main sections

- Component files with `data-component` attributes:
  - `Transport.svelte` - Transport, PlayButton, SkipBackButton, SkipForwardButton
  - `Grid.svelte` - Grid
  - `TrackSelector.svelte` - TrackSelector
  - `TrackControls.svelte` - TrackControls
  - `TrackEffectsPanel.svelte` - TrackEffectsPanel
  - `Footer.svelte` - Footer
  - `WindowSwitcher.svelte` - WindowSwitcher
  - `FollowToggle.svelte` - FollowToggle
  - `ShareMenu.svelte` - ShareMenu
  - `SettingsMenu.svelte` - SettingsMenu
  - `ArrowSelector.svelte` - ArrowSelector, ArrowButton:Previous, ArrowButton:Next
  - `KnobControl.svelte` - KnobControl
  - `PatternArranger.svelte` - PatternArranger
  - `ArrangerTransport.svelte` - ArrangerTransport, ArrangerPlayButton
  - `PatternSelector.svelte` - PatternSelector
  - `TrackBar.svelte` - TrackBar

### Component Naming Convention
Each component has a `data-component` attribute with its name:
- `AppRail` - Left sidebar rail
- `Brand` - Logo and branding
- `VolumeCard` - Volume knob card
- `KnobControl` - Volume/parameter knobs
- `RailStats` - Stats section (tempo, bars, etc.)
- `Workspace` - Main workspace area
- `WorkspaceHeader` - Header with project name
- `TrackControlsWrapper` - Track controls container
- `GridShell` - Grid container
- `GridToolbar` - Grid toolbar with note length selector
- `GridBackdrop` - Grid background container
- `TrackEffectsWrapper` - Effects panel container
- `PlayButton` - Main play/stop button
- `SkipBackButton` - Skip to previous bar button
- `SkipForwardButton` - Skip to next bar button
- `ArrowButton:Previous` - Previous arrow in selectors
- `ArrowButton:Next` - Next arrow in selectors
- `ArrangerPlayButton` - Pattern arranger play button
- Plus all individual components listed above

### CSS Implementation
```css
/* Dev mode indicator (fixed at top center) */
.dev-mode-indicator {
  position: fixed;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  background: rgba(255, 165, 0, 0.95);
  color: #000;
  pointer-events: none;
}

/* Fixed tooltip box in bottom-right corner */
.dev-mode-tooltip {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.tooltip-content {
  padding: 12px 16px;
  background: rgba(255, 165, 0, 0.95);
  color: #000;
  font-family: 'Courier New', monospace;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}
```

## Accessibility
- Dev mode tooltips have `pointer-events: none` so they don't interfere with interactions
- Tooltips are JavaScript-based but don't receive focus
- Respects `prefers-reduced-motion` preference
- No animation if reduced motion is preferred

## Design Considerations
- **Non-intrusive**: Only shows when explicitly enabled
- **No Overlap**: Fixed position prevents labels from covering each other
- **Persistent**: State saved to localStorage
- **Visible**: Orange/yellow color stands out clearly
- **Simple**: Pure CSS solution, no JavaScript tooltip positioning
- **Fast**: No performance impact when disabled

## Future Enhancements
Potential additions (not implemented):
- Add more granular component labels
- Export component map as JSON
- Add visual hierarchy indicators
- Click-to-copy component path
- Integration with Storybook or design tools
