# Build Checklist

Use this checklist to orchestrate delivery of the Bloops MVP. Complete items in order within each phase and record owner initials and dates as work progresses.

## 1. Foundations
- [ ] Confirm product requirements with stakeholders and lock MVP scope.
- [ ] Audit audio engine libraries and decide between Tone.js customization or bespoke Web Audio implementation.
- [ ] Establish repository tooling (TypeScript, Vite/React, ESLint, Prettier, Vitest, Playwright).
- [ ] Configure CI for linting, testing, and bundle size checks on pull requests.
- [ ] Document coding standards and branching strategy in `CONTRIBUTING.md`.

## 2. Design & UX
- [ ] Import mockups into design system file and annotate interaction states.
- [ ] Translate provided design tokens into CSS variables and component guidelines.
- [ ] Validate accessibility for color contrast and keyboard flows in prototypes.
- [ ] Create responsive layouts for desktop, tablet, and compact laptop breakpoints.

## 3. Sequencer Core
- [ ] Implement audio clock with deterministic scheduling buffer (≥200 ms lookahead).
- [ ] Build grid renderer supporting whole to 1/64 resolution with zoom controls.
- [ ] Add note editing interactions (add, resize, delete, velocity) with undo/redo history.
- [ ] Wire Follow Mode toggle with smooth scrolling synchronized to playhead.
- [ ] Enable Edit-While-Playing behavior that decouples view scrolling from playback.
- [ ] Enforce five-minute loop length cap through validation and UI feedback.

## 4. Track & Instrument Management
- [ ] Create track list UI with add/remove, rename, color assignment.
- [ ] Support up to ten concurrent tracks with individual mute, solo, and volume sliders.
- [ ] Integrate chiptune instrument presets and allow swapping without audio gaps.
- [ ] Implement per-track scale overlays and ghost note options.

## 5. Scale & Harmony Tools
- [ ] Build global scale selector with preview playback of tonic and chord tones.
- [ ] Highlight in-scale notes and provide contextual tooltip for out-of-scale placements.
- [ ] Persist selected scale per project and reflect in exported JSON.

## 6. Project Persistence & Sharing
- [ ] Implement local project storage via IndexedDB with migration strategy.
- [ ] Add project browser for create/duplicate/delete actions.
- [ ] Provide export to JSON (project data) and offline `.wav` render using OfflineAudioContext.
- [ ] Support import of previously exported project JSON.

## 7. QA & Performance
- [ ] Create automated tests for timing accuracy, undo/redo history, and serialization.
- [ ] Profile playback performance at 120, 140, and 160 BPM with ten tracks @1/64 resolution.
- [ ] Measure memory usage under stress scenarios and optimize sample loading.
- [ ] Run accessibility audit (Axe, manual screen reader pass) on primary flows.
- [ ] Conduct cross-browser testing (Chrome, Edge, Firefox, Safari desktop; iPad Safari/Chrome).

## 8. Launch Preparation
- [ ] Finalize onboarding tutorial and help content.
- [ ] Prepare marketing landing page sections describing MVP capabilities.
- [ ] Document known limitations and backlog items for post-MVP roadmap.
- [ ] Coordinate launch plan with marketing, support, and community teams.

## 9. Post-Launch Follow-up
- [ ] Instrument analytics events for track creation, play, export, and retention metrics.
- [ ] Schedule user feedback sessions two weeks post-launch.
- [ ] Review backlog and reprioritize based on telemetry and user interviews.

Keep the checklist updated; unchecked items become part of the next sprint planning conversation.
