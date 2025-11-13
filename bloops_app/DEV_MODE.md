# Development Mode Feature

## Overview
A toggle-able development mode that displays component names on hover to help identify and describe different screen components.

## Usage

### Enable/Disable Dev Mode
- **Keyboard Shortcut**: Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac)
- A yellow indicator "DEV MODE" will appear at the top of the screen when enabled

### Component Labels
When dev mode is enabled:
- Hover over any UI component
- An orange label will appear in the top-right corner showing the component name
- Labels use a monospace font for clarity

## Implementation Details

### Files Created
- `src/store/devModeStore.js` - Svelte store for managing dev mode state
  - Persists state to localStorage
  - Provides `toggle()`, `enable()`, and `disable()` methods

### Files Modified
- `src/App.svelte` - Main app component
  - Added dev mode import and subscription
  - Added keyboard shortcut handler (Ctrl+Shift+D)
  - Added dev mode indicator UI
  - Added CSS for dev mode tooltips
  - Added `data-component` attributes to main sections

- `src/components/Transport.svelte` - Added data-component="Transport"
- `src/components/Grid.svelte` - Added data-component="Grid"
- `src/components/TrackSelector.svelte` - Added data-component="TrackSelector"
- `src/components/TrackControls.svelte` - Added data-component="TrackControls"
- `src/components/TrackEffectsPanel.svelte` - Added data-component="TrackEffectsPanel"
- `src/components/Footer.svelte` - Added data-component="Footer"
- `src/components/WindowSwitcher.svelte` - Added data-component="WindowSwitcher"
- `src/components/FollowToggle.svelte` - Added data-component="FollowToggle"
- `src/components/ShareMenu.svelte` - Added data-component="ShareMenu"
- `src/components/SettingsMenu.svelte` - Added data-component="SettingsMenu"

### Component Naming Convention
Each component has a `data-component` attribute with its name:
- `AppRail` - Left sidebar rail
- `Brand` - Logo and branding
- `VolumeCard` - Volume knob card
- `RailStats` - Stats section (tempo, bars, etc.)
- `Workspace` - Main workspace area
- `WorkspaceHeader` - Header with project name
- `TrackControlsWrapper` - Track controls container
- `GridShell` - Grid container
- `GridToolbar` - Grid toolbar with note length selector
- `GridBackdrop` - Grid background container
- `TrackEffectsWrapper` - Effects panel container
- Plus all individual components listed above

### CSS Implementation
```css
/* Dev mode indicator (fixed at top) */
.dev-mode-indicator {
  position: fixed;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  background: rgba(255, 165, 0, 0.95);
  color: #000;
}

/* Tooltips on hover */
.dev-mode [data-component]:hover::after {
  content: attr(data-component);
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 9999;
  background: rgba(255, 165, 0, 0.95);
  color: #000;
  font-family: 'Courier New', monospace;
}
```

## Accessibility
- Dev mode tooltips use `pointer-events: none` so they don't interfere with interactions
- Tooltips are CSS-based (pseudo-elements) so they're not announced by screen readers
- Respects `prefers-reduced-motion` preference
- No animation if reduced motion is preferred

## Design Considerations
- **Non-intrusive**: Only shows when explicitly enabled
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
