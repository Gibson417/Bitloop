# Bitloop MVP Scope

The MVP centers on delivering a responsive, browser-based chiptune loop sequencer that allows musicians to author and share short-form loops with a dot-grid interface. The scope prioritizes stability, predictable timing, and an intuitive editing workflow at 120–160 BPM with up to ten concurrent tracks.

## Core Experience

### Sequencer Grid
- Resolution selector from whole notes down to 1/64th notes.
- Dot-grid display that visualizes beats horizontally and pitch vertically per track.
- Click/drag interactions for adding, resizing, and deleting notes with quantized placement.
- Visual differentiation between active scale notes, accidentals, and muted steps.

### Playback & Timing
- Audio engine built with Web Audio API and sample-based chiptune instruments.
- Play, pause, stop, and loop controls with keyboard shortcuts (`Space`, `Enter`).
- Follow Mode that scrolls the viewport with the playhead when enabled.
- Edit-While-Playing Mode that keeps the viewport static for detailed editing.
- Loop length capped at five minutes regardless of BPM or resolution.

### Track Management
- Up to ten simultaneous tracks with per-track mute, solo, volume, and expressive shape controls.
- Instrument selector with classic waveforms plus a custom wave-shaping slider for bespoke timbres.
- Built-in filter and delay effects per track for quick sound design without leaving the loop view.
- Track color coding and naming for quick visual parsing.

### Scale & Harmony Tools
- Global scale chooser covering major, minor, pentatonic, and modal options.
- Scale-aware snapping that highlights in-scale notes and discourages out-of-scale placements.
- Optional ghost notes showing relative intervals of other tracks for harmonic reference.

### Project Handling
- Create, duplicate, and delete projects stored locally (IndexedDB) with export/import via JSON.
- Auto-save on edit events with undo/redo history spanning the last 100 actions.
- Shareable loop export as `.wav` (offline render) and `.json` (project data).
- One-click share links that encode the project state for easy remixing and community circulation.

## Performance Targets
- Consistent playback without audible jitter between 120–160 BPM on mid-range laptops and tablets.
- Sequencer interactions must respond within 100 ms while audio is playing.
- Memory usage under 200 MB for projects utilizing all ten tracks at 1/64 resolution for the five-minute maximum length.

## Accessibility & Responsiveness
- Keyboard navigable interface with focus indicators and ARIA labels on controls.
- Responsive layout for desktop (≥1280px), tablet (≥768px), and a streamlined mobile editing lane (≥480px).
- High-contrast theme with adjustable font scaling (90%–130%).

## Out of Scope for MVP
- User accounts or cloud sync.
- Collaborative real-time editing.
- Advanced automation lanes (filter sweeps, volume envelopes) beyond basic per-note velocity.
- Mobile phone layouts (<600px width).

Revisit this scope only after stability, timing accuracy, and the defined workflow are validated with the initial user group.
