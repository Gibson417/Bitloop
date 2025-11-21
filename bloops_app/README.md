# UNKNOWN Application

This directory contains the main UNKNOWN web application.

## Quick Start

```bash
npm install
npm run dev
```

Then open your browser at `http://localhost:5173`.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run coverage` - Generate test coverage report
- `npm run check` - Run Svelte type checking

## Documentation

For full documentation, please see the [main repository README](../README.md) and the [docs directory](../docs/).

- [Quick Onboarding Guide](../docs/process/quick_onboarding.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [MVP Scope](../docs/product/mvp-scope.md)

## Project Structure

```
src/
├── components/       # Svelte UI components
│   ├── Grid.svelte
│   ├── Transport.svelte
│   ├── TrackControls.svelte
│   ├── TrackSelector.svelte
│   ├── Footer.svelte
│   └── ThemeSelector.svelte
├── lib/             # Utilities and helpers
│   ├── colorTokens.js
│   ├── scales.js
│   ├── scheduler.js
│   ├── sound.js
│   ├── notes.js
│   ├── offlineRenderer.js
│   └── midiExporter.js
├── store/           # State management
│   ├── projectStore.js
│   ├── libraryStore.js
│   └── themeStore.js
├── App.svelte       # Main application component
└── main.js          # Application entry point
```

## License

This project is shared for educational and collaboration purposes.
