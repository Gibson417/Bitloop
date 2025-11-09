# Milestone Plan

The milestone plan spans twelve weeks and focuses on delivering a stable, performant MVP. Each milestone ends with a demo and QA gate.

## Milestone 0 – Kickoff (Week 1)
- Finalize requirements, scope, and success metrics.
- Align engineering, design, and audio teams on responsibilities.
- Produce technical architecture outline and sequencing technology spike results.

## Milestone 1 – Sequencer Foundations (Weeks 2–3)
- Establish project scaffold with chosen front-end stack and CI pipeline.
- Implement audio clock prototype with Web Audio lookahead scheduling.
- Render static grid with zoomable resolutions from whole to 1/64 notes.
- Demo: deterministic timing prototype with visual playhead.

## Milestone 2 – Interactive Editing (Weeks 4–5)
- Enable note creation, deletion, resizing, and velocity adjustments.
- Add undo/redo stack with 100-action depth.
- Introduce Follow Mode and Edit-While-Playing toggle interactions.
- Demo: editing notes during playback with <100 ms UI latency at 140 BPM.

## Milestone 3 – Tracks & Instruments (Weeks 6–7)
- Implement track list management (add/remove/rename/color) up to ten tracks.
- Integrate chiptune instrument presets with seamless switching.
- Add per-track mute, solo, volume, and ghost note overlays.
- Demo: multi-track arrangement at 160 BPM with stable playback.

## Milestone 4 – Scale Tools & Persistence (Weeks 8–9)
- Build global scale selector with highlighted grid states.
- Persist scale choice, track settings, and notes via IndexedDB.
- Implement project browser and JSON import/export.
- Demo: reloadable project demonstrating scale-aware editing and autosave.

## Milestone 5 – Polish & Launch Prep (Weeks 10–11)
- Conduct performance profiling, memory optimization, and cross-browser QA.
- Complete accessibility audit and address critical findings.
- Produce onboarding tutorial, help content, and marketing copy.
- Demo: full end-to-end workflow from project creation to `.wav` export.

## Milestone 6 – Launch (Week 12)
- Freeze feature development and address launch-blocking bugs.
- Run release checklist, including regression suite and sign-offs.
- Publish MVP and monitor analytics/feedback channels.

## Post-Launch (Week 13+)
- Analyze telemetry and user feedback to refine backlog priorities.
- Plan follow-up iterations focused on collaboration, automation, and mobile support.
