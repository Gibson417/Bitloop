# UNKNOWN  
*A modern, intuitive chiptune loop composer for the browser.*

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/Gibson417/Bitloop)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](https://github.com/Gibson417/Bitloop)

## 📥 Download & Install

### Windows
Choose the version that works best for you:

| Version | Description | Auto-Updates |
|---------|-------------|--------------|
| **[⬇️ UNKNOWN Installer](https://github.com/Gibson417/Bitloop/releases/download/latest/UNKNOWN-Setup.exe)** | Standard installer with auto-update support | ✅ Yes |
| **[⬇️ UNKNOWN Portable](https://github.com/Gibson417/Bitloop/releases/download/latest/UNKNOWN-Portable.exe)** | No installation required, runs anywhere | ❌ Manual |

> **Recommended:** Use the Installer version for automatic updates. The Portable version is perfect for USB drives or computers where you can't install software.

### Chromebook / Chrome OS
UNKNOWN is available as a Progressive Web App (PWA) that works great on Chromebooks:

1. Open the app in Chrome: [Launch UNKNOWN](https://gibson417.github.io/Bitloop/)
2. Click the **install icon** (⊕) in the address bar, or open Chrome menu (⋮) → "Install UNKNOWN..."
3. The app will install and appear in your app launcher like a native app

> **Tip:** The PWA automatically updates to the latest version whenever you're online. It also works offline after first install and runs in its own window without browser UI.

### Web Browser
Simply open [UNKNOWN in your browser](https://gibson417.github.io/Bitloop/) - no installation needed! The browser version automatically stays up to date.

> **Troubleshooting:** If you see a blank page or the README instead of the app, try clearing your browser cache or opening in an incognito/private window. Repository owners: make sure GitHub Pages is configured to deploy from "GitHub Actions" in Settings → Pages.

---

UNKNOWN is designed to feel effortless, musical, and inspiring. Instead of rows of piano-roll rectangles, UNKNOWN uses a **dot-grid melody interface** that feels playful and fluid — almost like sketching with sound.

This is a tool for capturing ideas quickly, looping them, refining them, and *staying in the creative headspace* rather than wrestling with technical machinery.

## 🎯 Current Status

**MVP Status:** ✅ **Feature Complete**

All core MVP features have been successfully implemented and tested:
- ✅ Interactive dot-grid sequencer with note editing
- ✅ Multi-track support (up to 10 tracks)
- ✅ WebAudio-based chiptune sound engine
- ✅ Real-time playback with stable timing
- ✅ Follow Mode and Edit-While-Playing
- ✅ Scale-aware note snapping
- ✅ Track controls (mute, solo, volume)
- ✅ Project save/load (JSON format)
- ✅ WAV export functionality
- ✅ Custom waveform shaping
- ✅ Per-track effects (filters, delays)
- ✅ Social sharing capabilities
- ✅ Comprehensive test coverage (52 passing tests)
- ✅ WCAG 2.2 AA accessibility compliance (~85%)
- ✅ PWA support (installable on Chromebooks and mobile devices)

## 📸 Visual Identity

![UNKNOWN application screenshot](https://github.com/user-attachments/assets/9a0b48cf-1fd1-4a1b-a956-f2b66cc2ac73)

![UNKNOWN wordmark and dot grid logo](docs/images/brand-section.png)

## ✨ Core Experience

- **Dot-grid sequencer** with soft inactive notes and warm active highlights  
- **Edit while the music is playing** — no modal interruptions  
- **Follow mode toggle** to either chase the playhead or stay where you're working  
- **Up to 10 tracks**, each with scale, octave, wave, volume, mute & solo  
- **Note resolution from whole notes → 1/64**  
- **Loop length up to 5 minutes**, automatically calculated from BPM + bar count  
- **Built-in scale chooser** keeps melodies musical without forcing theory knowledge  
- **Warm chiptune sound palette** (square, triangle, saw, noise, light-softening envelope)

UNKNOWN encourages **flow** — curiosity, repetition, listening, adjusting, evolving.

## 🎨 Visual Identity & Design Language

| Token | Value | Meaning |
|------|-------|--------|
| **Logo** | L3B | Pixel-style wordmark, soft retro rather than harsh arcade |
| **Grid Style** | G3 | Dot-grid with medium spacing and subtle glow |
| **Track Style** | T3 | Tracks identified by small accent chips (color-coded) |
| **Playhead** | P1 | Thin, calm, warm-accent vertical bar |
| **Accent Hue** | B-Warm | Teal with a touch of warmth, not icy or clinical |
| **Inactive Notes** | 2B strength | Softly present, never visually noisy |
| **Controls** | Compact | Discrete, compact sizing keeps focus on the grid |

The interface is dark, quiet, and gentle — it gets out of the way and lets *sound* lead. Controls are intentionally compact and discrete, ensuring the **grid remains the visual instrument** of the project.

## 🎼 Why It Exists

Most browser-based music makers fall into one of two extremes:
1. **Overly technical** (trackers, modular patching, chip-accurate systems), or  
2. **Toy-like quick sketch pads** that flatten expression.

UNKNOWN aims for the middle space:

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

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- A modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation & Running

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Gibson417/Bitloop.git
   cd Bitloop
   ```

2. **Install dependencies:**
   ```bash
   cd unknown_app
   npm install --legacy-peer-deps
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173` to access the application

### Testing

Run the comprehensive test suite:
```bash
npm run test        # Interactive watch mode
npm run test:run    # Single run (CI)
npm run coverage    # Generate coverage report
```

### Building for Production

```bash
npm run build       # Build optimized production bundle
npm run preview     # Preview production build locally
```

### Deploying to GitHub Pages

The app automatically deploys to GitHub Pages on every push to `main`. For first-time setup:

1. Go to **Settings → Pages** in your repository
2. Under **Source**, select **GitHub Actions** (NOT "Deploy from a branch")
3. Save the settings
4. Push to `main` or manually trigger the workflow

The app will be available at `https://<username>.github.io/<repo>/`

> **Important:** If you see the README rendered instead of the app, GitHub Pages is likely configured incorrectly. Go to Settings → Pages and change the Source to "GitHub Actions".

### Downloading the Desktop Application (Windows .exe)

You can download the portable Windows executable directly from [GitHub Releases](https://github.com/Gibson417/Bitloop/releases):

1. Go to the [Releases page](https://github.com/Gibson417/Bitloop/releases)
2. Download the `.exe` file from either:
   - **Latest Build** (pre-release): Most recent build from the main branch
   - **Versioned releases** (e.g., v0.1.0): Stable releases
3. Run the executable - no installation required!

**Note:** The "Latest Build" release is automatically updated whenever changes are merged to the main branch.

### Building Desktop Application (Windows .exe)

If you prefer to build from source, UNKNOWN can be built as a portable Windows application:

```bash
# Build for Windows (creates portable .exe in unknown_app/release/)
npm run electron:build

# Test the Electron app locally (rebuilds and launches)
npm run electron:dev
```

**Development tip:** For active development, use `npm run dev` to start the Vite development server with hot reloading. Use `npm run electron:dev` only to test the final packaged application behavior.

**Note:** Building for Windows on a non-Windows platform requires [Wine](https://www.winehq.org/) to be installed.

The portable executable will be created in `unknown_app/release/` directory:
- Windows: `UNKNOWN-Portable.exe` (portable, no installation required)

### Auto-Updates

The desktop application includes integrated auto-update functionality:
- Updates are checked automatically on startup
- When a new version is available, it downloads automatically in the background
- Users are notified when an update is ready to install
- Click "Restart & Install" to apply the update

Updates are distributed via GitHub Releases. To publish an update:
1. Update the version in `unknown_app/package.json`
2. Create a new GitHub Release with the portable `.exe` attached
3. Users running older versions will automatically be notified

## 📁 Project Structure

```
Bitloop/
├── unknown_app/              # Main Svelte application
│   ├── src/
│   │   ├── components/      # UI components (Grid, TrackBar, Transport, etc.)
│   │   ├── lib/            # Utilities (scales, audio, timing)
│   │   ├── store/          # State management (projectStore)
│   │   └── __tests__/      # Component and integration tests
│   ├── electron/           # Electron main process files
│   │   └── main.js         # Electron entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── docs/                    # Documentation
│   ├── process/            # Development workflow guides
│   ├── product/            # Product specs and planning
│   ├── design/             # Design tokens and visual identity
│   ├── reports/            # Test reports and audits
│   └── templates/          # Issue templates
├── CONTRIBUTING.md          # Contribution guidelines
└── README.md               # This file
```

## 🎯 Goals & Roadmap

### Current Phase: Post-MVP Enhancement
The MVP has been successfully delivered with all core features. Current focus areas:

1. **Performance Optimization**
   - Reduce memory footprint for long projects
   - Optimize canvas rendering for smoother grid interactions

2. **User Experience Refinement**
   - Enhanced mobile/tablet responsiveness
   - Additional keyboard shortcuts for power users
   - Improved onboarding flow for new users

3. **Feature Expansion**
   - Pattern-based composition tools
   - Tempo automation and time signature changes
   - MIDI input/output support
   - Collaboration features

### Future Vision
- Cloud sync and user accounts
- Real-time collaborative editing
- Community loop sharing platform
- Advanced automation lanes
- Plugin ecosystem for custom instruments/effects

For detailed milestone tracking, see [docs/product/milestone-plan.md](docs/product/milestone-plan.md)

## 🎧 Timing & Audio Notes

Scheduling must use:
- `setInterval`/`setTimeout` *only* for coarse scheduling
- `requestAnimationFrame` to update the playhead visually
- WebAudio scheduled note start times, queued ~100 ms ahead

This ensures no jitter, no grid tearing, and no “off by one frame” desync.

## 🌱 Future Roadmap (Not in MVP Yet)

- ~~WAV export~~ ✅ (Implemented)
- ~~Custom wave shapes~~ ✅ (Implemented)
- ~~Per-track effects (bitcrush, LPF/HPF)~~ ✅ (Implemented)
- ~~Social sharing / embed snippets~~ ✅ (Implemented)
- Record mode (turn tapping into notes) 🔜
- Pattern-based composition tools 🔜
- MIDI input/output support 🔜
- Tempo automation 🔜

## 📚 Documentation

### Getting Started
- [Quick Onboarding Guide](docs/process/quick_onboarding.md) - Developer setup and workflow
- [Contributing Guide](CONTRIBUTING.md) - How to contribute to the project
- [Build Checklist](docs/process/build-checklist.md) - Implementation roadmap

### Product Documentation
- [MVP Scope](docs/product/mvp-scope.md) - Feature specifications and boundaries
- [Milestone Plan](docs/product/milestone-plan.md) - Development timeline and phases
- [User Stories](docs/product/user-stories.md) - User-centered feature descriptions

### Design & Technical
- [Design Tokens](docs/design/design-tokens.json) - UI design system and styling
- [Test Reports](docs/reports/) - Quality assurance and testing documentation

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:
- Development setup and workflow
- Code style and conventions
- Testing requirements
- Pull request process
- Design principles

## 📊 Quality & Testing

- **Test Coverage:** 52 passing unit and integration tests
- **Accessibility:** WCAG 2.2 AA compliance (~85%)
- **Performance:** Stable playback at 120-160 BPM
- **Browser Support:** Chrome, Firefox, Safari, Edge (latest versions)

For detailed test reports, see [docs/reports/](docs/reports/)

## 🎨 Design Philosophy

UNKNOWN prioritizes **feel** over features:
- **Smooth playback:** Stable scheduler and precise timing
- **Fast, intuitive editing:** Zero perceived lag
- **Calm, minimal UI:** Encourages creative flow
- **Compact, discrete controls:** Grid-focused design with unobtrusive UI elements
- **Musical, not mechanical:** Easy to create good-sounding melodies

The interface is dark, quiet, and gentle — it gets out of the way and lets *sound* lead. Controls are intentionally compact to keep the **grid as the primary instrument**.

## 🪶 License

This project is shared for educational and collaboration purposes.
