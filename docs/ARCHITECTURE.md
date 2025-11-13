# Bloops Architecture

## Overview

Bloops is designed with a clear separation between business logic, design tokens, state management, and UI presentation. This separation facilitates future porting to non-web platforms (e.g., desktop apps, mobile apps, or other frameworks).

## Directory Structure

```
bloops_app/src/
├── lib/              # Business logic (platform-agnostic)
├── store/            # State management (Svelte stores, but logic is portable)
├── components/       # UI components (Svelte-specific)
├── App.svelte        # Main application orchestrator
└── main.js           # Application entry point
```

## Layer Responsibilities

### 1. Business Logic Layer (`src/lib/`)

**Purpose**: Core application logic that is independent of the UI framework.

**Files**:
- `scheduler.js` - WebAudio timing and playback scheduling
- `sound.js` - Sound synthesis, waveform generation, effects processing
- `scales.js` - Musical scale definitions and calculations
- `notes.js` - Note frequency calculations and mappings
- `persistence.js` - Project save/load functionality
- `offlineRenderer.js` - WAV audio export
- `midiExporter.js` - MIDI file export
- `colorTokens.js` - Design system tokens (colors, spacing, typography, touch targets)

**Portability**: These modules use vanilla JavaScript and can be reused in other frameworks with minimal changes:
- `scheduler.js`, `sound.js`, `offlineRenderer.js` depend on WebAudio API (would need platform-specific adapters)
- All other modules are framework-agnostic

### 2. State Management Layer (`src/store/`)

**Purpose**: Application state using Svelte stores.

**Files**:
- `projectStore.js` - Project data, tracks, notes, timing, undo/redo
- `libraryStore.js` - Pattern library state
- `themeStore.js` - Theme preferences
- `devModeStore.js` - Development mode toggles

**Portability**: While implemented with Svelte stores, the state structure and logic can be adapted to other state management solutions (Redux, MobX, Zustand, etc.).

### 3. UI Layer (`src/components/`)

**Purpose**: Svelte components for rendering and user interaction.

**Files**: 17 Svelte components handling different UI concerns:
- Grid display and editing
- Track controls and selection
- Transport controls (play, stop, navigation)
- Settings and configuration menus
- Export and sharing functionality

**Dependencies**:
- Import minimal business logic (mainly design tokens and scales)
- Communicate through events and props
- Access state through stores (passed as props in many cases)

### 4. Application Orchestrator (`src/App.svelte`)

**Purpose**: Main application component that:
- Initializes audio context and scheduler
- Manages playback lifecycle
- Coordinates between components and business logic
- Handles keyboard shortcuts
- Manages window/view state

**Current State**: 1832 lines (824 lines of script, 1008 lines of template/styles)

**Note**: This is the largest coupling point. Consider refactoring into smaller orchestrator modules for better portability.

## Design System

The design system is centralized in `src/lib/colorTokens.js`:

```javascript
export const colors = { /* color palette */ };
export const spacing = { /* 8px base grid */ };
export const radius = { /* border radius values */ };
export const typography = { /* font sizes, weights, etc. */ };
export const touchTarget = { 
  minimum: '44px',      // WCAG 2.2 AA compliance
  comfortable: '48px'   // Primary actions
};
export const opacity = { /* opacity values */ };
```

**Benefits**:
- Single source of truth for design values
- Easy to theme or rebrand
- Framework-agnostic (can be imported into any JS project)

## Porting Guidelines

### To Port to Another Web Framework (React, Vue, Angular, etc.)

1. **Keep**: `src/lib/` (business logic) - minimal changes needed
2. **Keep**: `src/store/` state structure - adapt to framework's state solution
3. **Rewrite**: `src/components/` - rebuild in target framework
4. **Refactor**: `src/App.svelte` - split into smaller controller modules

### To Port to Native Platform (Electron, Tauri, React Native, etc.)

1. **Keep**: Business logic in `src/lib/` (except audio-related)
2. **Adapt**: Audio modules for platform-specific APIs:
   - WebAudio → Native audio libraries
   - `scheduler.js` → Platform-specific timing
3. **Keep**: State management patterns
4. **Rewrite**: UI components for native UI toolkit
5. **Adapt**: Design tokens to platform conventions

### To Port to Non-Audio Application

1. **Remove**: Audio-specific modules (`scheduler.js`, `sound.js`, etc.)
2. **Keep**: State management patterns
3. **Keep**: Design token system
4. **Adapt**: Business logic for new domain

## Current Separation Quality: ✅ Good

### Strengths
- ✅ Business logic is in separate modules
- ✅ Design tokens are centralized and framework-agnostic
- ✅ State management is isolated in stores
- ✅ Components are mostly presentational

### Areas for Improvement (Optional)
- ⚠️ `App.svelte` is large (824 lines of logic) - could be split into:
  - `AudioController.js` - Audio initialization and playback
  - `KeyboardController.js` - Keyboard shortcut handling
  - `WindowController.js` - Window/view management
  - `ShareController.js` - Sharing and export logic
- ⚠️ Some components import directly from stores - consider prop drilling for better decoupling
- ⚠️ Audio-specific code is tightly coupled to WebAudio API

## Recommendations

### For Maintainers
1. **Keep business logic in `src/lib/`** - Don't put calculations or algorithms in components
2. **Use design tokens** - Don't hardcode colors, spacing, or sizing in components
3. **Keep components small** - Prefer many small components over few large ones
4. **Minimize direct store access** - Pass data through props when possible

### For Future Porting
1. **Create abstraction layer for audio** - Would make porting to native platforms easier
2. **Document state shape** - Makes adapting to other state management easier
3. **Extract orchestration logic** - Move logic from App.svelte to controller modules
4. **Consider dependency injection** - Would make testing and porting easier

## Testing Strategy

Tests are organized by layer:
- `src/lib/` - Pure logic testing (no DOM needed)
- `src/store/__tests__/` - State management testing
- `src/components/__tests__/` - Component testing with Svelte Testing Library
- `src/__tests__/` - Integration testing

## Conclusion

The current architecture provides **good separation** between design and logic, making future non-web porting feasible with moderate effort. The main work would be:
1. Adapting audio APIs to the target platform
2. Rewriting UI components in the target framework
3. Refactoring the App orchestrator for better modularity

The business logic, state patterns, and design system are already well-positioned for reuse.
