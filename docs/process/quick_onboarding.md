# Bloops — Quick Onboarding

Welcome to Bloops! This guide gets new contributors up to speed quickly.

## 1 Run the project

```bash
npm install
npm run dev
```

Open your browser at `http://localhost:5173` to see the running app.

## 2 Core Idea

Bloops is a **dot‑grid sequencer**. You place dots in the grid to make notes.  
The app keeps looping and you can add or remove notes without stopping playback.  
It’s built to feel **musical, not mechanical**.

## 3 Build Order (Very Important)

1. **Grid rendering (UI only)** — draw inactive dots and handle note toggles.
2. **Note toggling** — clicking or dragging toggles notes on/off.
3. **Playhead animation** — draw the vertical line moving across the grid (no audio yet).
4. **WebAudio scheduler + sound** — add audio playback and scheduling.
5. **Track controls** — implement scale, octave, wave, volume, mute, solo.
6. **Follow Mode toggle** — switch between following the playhead and editing freely.
7. **JSON import/export** — save and load project data.

## 4 What Matters Most

• Smooth playback (stable scheduler and precise timing)  
• Fast, intuitive note editing (zero perceived lag)  
• Calm and minimal UI that encourages creative flow

## 5 Sound Direction

Use simple chiptune oscillators: square, triangle, saw and noise. Each note should have a soft envelope to avoid harsh clicks and pops.

## 6 Loop Time Cap

Total loop duration should always be less than or equal to **5 minutes (300 seconds)**.  
Whenever the user changes BPM or bars, the app recalculates the maximum number of bars allowed and updates the UI accordingly.

## 7 When in Doubt

Prioritize **feel** over features. If you must choose between adding a new feature and improving the responsiveness of the grid or audio, choose responsiveness. The sequencer should be **pleasant to use**.