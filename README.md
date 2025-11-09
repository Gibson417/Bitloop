# BitLoops  
*A modern, intuitive chiptune loop composer for the browser.*

BitLoops is designed to feel effortless, musical, and inspiring.  
Instead of rows of piano-roll rectangles, BitLoops uses a **dot-grid melody interface** that feels playful and fluid — almost like sketching with sound.

This is a tool for capturing ideas quickly, looping them, refining them, and *staying in the creative headspace* rather than wrestling with technical machinery.

## ✨ Core Experience

- **Dot-grid sequencer** with soft inactive notes and warm active highlights  
- **Edit while the music is playing** — no modal interruptions  
- **Follow mode toggle** to either chase the playhead or stay where you're working  
- **Up to 10 tracks**, each with scale, octave, wave, volume, mute & solo  
- **Note resolution from whole notes → 1/64**  
- **Loop length up to 5 minutes**, automatically calculated from BPM + bar count  
- **Built-in scale chooser** keeps melodies musical without forcing theory knowledge  
- **Warm chiptune sound palette** (square, triangle, saw, noise, light-softening envelope)

BitLoops encourages **flow** — curiosity, repetition, listening, adjusting, evolving.

## 🎨 Visual Identity & Design Language

| Token | Value | Meaning |
|------|-------|--------|
| **Logo** | L3B | Pixel-style wordmark, soft retro rather than harsh arcade |
| **Grid Style** | G3 | Dot-grid with medium spacing and subtle glow |
| **Track Style** | T3 | Tracks identified by small accent chips (color-coded) |
| **Playhead** | P1 | Thin, calm, warm-accent vertical bar |
| **Accent Hue** | B-Warm | Teal with a touch of warmth, not icy or clinical |
| **Inactive Notes** | 2B strength | Softly present, never visually noisy |

The interface is dark, quiet, and gentle — it gets out of the way and lets *sound* lead.

## 🎼 Why It Exists

Most browser-based music makers fall into one of two extremes:
1. **Overly technical** (trackers, modular patching, chip-accurate systems), or  
2. **Toy-like quick sketch pads** that flatten expression.

BitLoops aims for the middle space:

**Simple enough to start instantly.**  
**Deep enough to shape real music.**

A tool for:

- Melody writers
- Ambient creators
- Game composers
- People who think in loops
- People who want to *feel* their way into a song

## 🧠 MVP Scope (What to Build First)

The initial version focuses on:

- 10 tracks, each with:
  - Waveform: square | triangle | saw | noise
  - Scale chooser
  - Octave control
  - Volume, mute, solo
- Dot-grid sequencer (no square outline — just dots)
- Play / Stop control
- **Follow Mode** toggle
- **Edit-While-Playing always enabled**
- Loop length capped to **≤ 300 seconds (5:00)**
- Export / import **JSON project files**
- Smooth WebAudio timing (playhead + requestAnimationFrame sync)

## 🏛️ Architecture

```
src/
  components/
    Grid.svelte          # dot canvas + note editing
    TrackBar.svelte      # track chips + controls
    Transport.svelte     # play/stop + follow mode UI
    Footer.svelte        # BPM, bars, steps, time length display
  lib/
    colorTokens.js       # design tokens from spec
    scales.js            # scale definitions & pitch mapping
    scheduler.js         # WebAudio timing loop (added in later phase)
  store/
    projectStore.js      # project state, tracks, timing
  App.svelte
  main.js
```

## 🛠 Setup & Run

```bash
npm install
npm run dev
```

Then open your browser at `http://localhost:5173` to access the app.

## 🎧 Timing & Audio Notes

Scheduling must use:
- `setInterval`/`setTimeout` *only* for coarse scheduling
- `requestAnimationFrame` to update the playhead visually
- WebAudio scheduled note start times, queued ~100 ms ahead

This ensures no jitter, no grid tearing, and no “off by one frame” desync.

## 🌱 Future Roadmap (Not in MVP Yet)

- WAV export
- Custom wave shapes
- Per-track effects (bitcrush, LPF/HPF)
- Record mode (turn tapping into notes)
- Social sharing / embed snippets

## 🪶 License

This project is shared for educational and collaboration purposes.
