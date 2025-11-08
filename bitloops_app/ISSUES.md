# BitLoops – Starter Issue List

This document contains copy‑and‑paste templates for creating your first GitHub issues. Each issue corresponds to a key milestone in the MVP build.

## Issue 1 — Project Setup & Scaffold

**Title:** Initialize Svelte + Tailwind project  
**Labels:** `setup`, `environment`  
**Description:**

* Create a new SvelteKit or Vite + Svelte project.
* Install Tailwind CSS and PostCSS.
* Confirm hot‑reload works.
* Add `/src/lib/colorTokens.js` and `/src/lib/scales.js` from the design spec.

**Acceptance Criteria:**

* Application runs via `npm run dev` without errors.
* Tailwind classes compile correctly.
* No errors appear in the browser console.

---

## Issue 2 — Design Tokens & Theme

**Title:** Implement global design tokens (UI identity)  
**Labels:** `ui`, `styling`  
**Description:**

Create a Tailwind theme extension using the BitLoops design tokens:

```
Accent (primary): B‑Warm (#78D2B9)
Note Active: #78D2FF
Note Inactive: #3C4450 (strength 2B)
Background: #0E1016
Panel Background: #161A24
```

**Acceptance Criteria:**

* All tokens can be referenced via Tailwind classes (e.g., `text-accent`, `bg-panel`).
* No unstyled, hard‑coded colors remain in components.

---

## Issue 3 — Dot Grid Rendering

**Title:** Implement Grid.svelte dot renderer (no square lattice)  
**Labels:** `ui`, `canvas`  
**Description:**

* Render a dot grid using `<canvas>`.
* Inactive dots should appear as soft grey circles.
* Active dots should appear in the accent color with a subtle glow.
* Clicking toggles note on/off; dragging allows painting/erasing multiple notes.

**Acceptance Criteria:**

* Dots scale consistently with window size and device pixel ratio.
* User can toggle notes individually and with click‑drag.

---

## Issue 4 — TrackBar UI

**Title:** Implement TrackBar UI with T3 accent chip  
**Labels:** `ui`  
**Description:**

* Build the top bar that lists up to 10 tracks.
* Each track should have a colored accent strip (the chip) to identify the track.
* Include controls for wave type, scale, octave, volume, mute, solo.

**Acceptance Criteria:**

* Track chip width = 110 px, accent strip width = 12 px.
* Controls are aligned and responsive.
* Clicking a track selects it and deselects others.

---

## Issue 5 — Transport Controls

**Title:** Implement Play / Stop / Follow Toggle  
**Labels:** `ui`, `audio`  
**Description:**

* Add a transport rail with Play and Stop buttons.
* Include a toggle for Follow mode: when ON, the view follows the playhead; when OFF, it stays where the user is editing.

**Acceptance Criteria:**

* Play starts audio and moves the playhead.
* Stop resets playback to step 1.
* Follow toggle visibly indicates its state and updates the grid view behavior accordingly.

---

## Issue 6 — Scheduler (Audio Timing)

**Title:** Implement WebAudio scheduler with lookahead + rAF sync  
**Labels:** `audio`, `core`  
**Description:**

* Create a scheduler that queues notes ahead of time for smooth playback.
* Use `requestAnimationFrame` to sync the playhead animation.
* Keep CPU and memory usage low, even at 1/64 resolution and high BPM.

**Acceptance Criteria:**

* Playback is stable at 120–160 BPM with up to 10 tracks and 1/64 resolution.
* There are no audible clicks or pops on note starts.
* The playhead line matches what the user hears.

---

## Issue 7 — JSON Import / Export

**Title:** Implement project persistence  
**Labels:** `storage`  
**Description:**

* Add functions to serialize and deserialize project state as JSON files (`*.bitloops.json`).
* Provide import and export buttons in the UI.

**Acceptance Criteria:**

* Exported files include BPM, steps, bars, and all track note data.
* Importing a previously saved file restores the full session identically.
* Version mismatches are handled gracefully.

---

## Issue 8 — Loop Length Cap

**Title:** Enforce ≤ 5‑minute total sequence duration  
**Labels:** `timing`, `logic`  
**Description:**

* Calculate the maximum allowed number of bars based on the current BPM and steps per bar so that total time ≤ 300 seconds.
* Update the UI to show the resulting loop length and disable values that would exceed the limit.

**Acceptance Criteria:**

* Adjusting BPM or bars immediately updates the displayed loop length.
* The user cannot set bars or BPM combinations that yield >300 s total duration.