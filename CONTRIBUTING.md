# Contributing to Bloops

Thank you for your interest in contributing to Bloops! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- A modern web browser

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/Gibson417/Bloops.git
cd Bloops
```

2. Install dependencies:
```bash
cd bloops_app
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser at `http://localhost:5173`

## Project Structure

```
Bloops/
├── bloops_app/          # Main application code
│   ├── src/
│   │   ├── components/    # Svelte components
│   │   ├── lib/          # Utility libraries
│   │   ├── store/        # State management
│   │   └── __tests__/    # Test files
│   ├── index.html
│   └── package.json
├── docs/                  # Documentation
│   ├── process/           # Quick start & delivery guides
│   ├── product/           # MVP scope, milestones, user stories
│   ├── design/            # Shared design tokens
│   └── templates/         # Issue templates
└── README.md             # Main project documentation
```

## Development Workflow

### Build Order Priority

When implementing features, follow this order (as specified in `docs/process/quick_onboarding.md`):

1. Grid rendering (UI only)
2. Note toggling
3. Playhead animation
4. WebAudio scheduler + sound
5. Track controls
6. Follow Mode toggle
7. JSON import/export

### Code Style

- Use 2 spaces for indentation
- Follow existing code patterns and naming conventions
- Write clear, descriptive variable and function names
- Add comments for complex logic

### Testing

Run tests before submitting changes:

```bash
npm run test        # Run tests in watch mode
npm run test:run    # Run tests once
npm run coverage    # Generate coverage report
```

### Type Checking

Run Svelte type checking:

```bash
npm run check
```

## Design Principles

Bloops prioritizes **feel** over features:

- **Smooth playback**: Stable scheduler and precise timing
- **Fast, intuitive editing**: Zero perceived lag
- **Calm, minimal UI**: Encourages creative flow
- **Musical, not mechanical**: Easy to create good-sounding melodies

### UI/UX Guidelines

- Use the design tokens defined in `docs/design/design-tokens.json`
- Maintain the dot-grid aesthetic (no square lattice)
- Keep the interface dark, quiet, and gentle
- Ensure controls are accessible and touch-friendly
- Follow the color palette:
  - Accent: `#78d2b9` (teal with warmth)
  - Note Active: `#78d2ff`
  - Note Inactive: `#3c4450`
  - Background: `#0e1016`
  - Panel: `#161a24`

## Audio Implementation

- Use WebAudio API for sound generation
- Schedule notes ~100ms ahead to prevent jitter
- Use `requestAnimationFrame` for playhead animation
- Apply soft envelopes to avoid clicks and pops
- Support waveforms: square, triangle, sawtooth, noise

## Submitting Changes

1. Create a feature branch from `main`
2. Make your changes following the guidelines above
3. Test thoroughly (including mobile/responsive views)
4. Ensure tests pass: `npm run test:run`
5. Run type checking: `npm run check`
6. Commit with clear, descriptive messages
7. Push your branch and open a pull request

### Pull Request Guidelines

- Provide a clear description of what changes were made and why
- Reference any related issues
- Include screenshots for UI changes
- Ensure CI checks pass

## Questions or Issues?

- Check the [documentation](docs/)
- Review existing [issues](https://github.com/Gibson417/Bloops/issues)
- Open a new issue for bugs or feature requests

## License

By contributing to Bloops, you agree that your contributions will be licensed under the project's license.
