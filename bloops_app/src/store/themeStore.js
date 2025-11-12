import { writable } from 'svelte/store';

const THEME_KEY = 'bloops-theme';
const THEMES = {
  dark: {
    name: 'Dark',
    colors: {
      accent: '#78d2b9',
      accentRgb: '120, 210, 185',
      accentBright: '#9BFFE0',
      accentBrightRgb: '155, 255, 224',
      noteActive: '#78d2ff',
      noteActiveRgb: '120, 210, 255',
      noteInactive: '#3c4450',
      background: '#1a1d28',
      panel: '#222632',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.7)'
    }
  },
  light: {
    name: 'Light',
    colors: {
      accent: '#1a8a7a',
      accentRgb: '26, 138, 122',
      accentBright: '#0e6d5f',
      accentBrightRgb: '14, 109, 95',
      noteActive: '#0d7ac4',
      noteActiveRgb: '13, 122, 196',
      noteInactive: '#7a8190',
      background: '#fafbfc',
      panel: '#ffffff',
      text: '#1a1d28',
      textMuted: 'rgba(26, 29, 40, 0.65)'
    }
  },
  classic: {
    name: 'Classic',
    colors: {
      accent: '#ff6b9d',
      accentRgb: '255, 107, 157',
      accentBright: '#FFB3D0',
      accentBrightRgb: '255, 179, 208',
      noteActive: '#ffd93d',
      noteActiveRgb: '255, 217, 61',
      noteInactive: '#6c5b7b',
      background: '#0f0a1f',
      panel: '#1f1433',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.75)'
    }
  },
  sunset: {
    name: 'Sunset',
    colors: {
      accent: '#ff8c42',
      accentRgb: '255, 140, 66',
      accentBright: '#ffb380',
      accentBrightRgb: '255, 179, 128',
      noteActive: '#ff6b9d',
      noteActiveRgb: '255, 107, 157',
      noteInactive: '#4a3f35',
      background: '#1f1410',
      panel: '#2d1f18',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.7)'
    }
  },
  ocean: {
    name: 'Ocean',
    colors: {
      accent: '#4ec9e0',
      accentRgb: '78, 201, 224',
      accentBright: '#7fd8eb',
      accentBrightRgb: '127, 216, 235',
      noteActive: '#6b8fff',
      noteActiveRgb: '107, 143, 255',
      noteInactive: '#2d4a5a',
      background: '#0d1b24',
      panel: '#15252e',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.7)'
    }
  },
  forest: {
    name: 'Forest',
    colors: {
      accent: '#7fc251',
      accentRgb: '127, 194, 81',
      accentBright: '#a0d97d',
      accentBrightRgb: '160, 217, 125',
      noteActive: '#b8d96c',
      noteActiveRgb: '184, 217, 108',
      noteInactive: '#3d4a2f',
      background: '#141a0f',
      panel: '#1d2616',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.7)'
    }
  },
  cyberpunk: {
    name: 'Cyberpunk',
    colors: {
      accent: '#ff00ff',
      accentRgb: '255, 0, 255',
      accentBright: '#ff66ff',
      accentBrightRgb: '255, 102, 255',
      noteActive: '#00ffff',
      noteActiveRgb: '0, 255, 255',
      noteInactive: '#4a2d4a',
      background: '#0a0014',
      panel: '#1a0028',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.75)'
    }
  },
  monochrome: {
    name: 'Monochrome',
    colors: {
      accent: '#888888',
      accentRgb: '136, 136, 136',
      accentBright: '#b8b8b8',
      accentBrightRgb: '184, 184, 184',
      noteActive: '#cccccc',
      noteActiveRgb: '204, 204, 204',
      noteInactive: '#444444',
      background: '#0f0f0f',
      panel: '#1a1a1a',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.7)'
    }
  }
};

const loadTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return THEMES[stored] ? stored : 'dark';
  } catch {
    return 'dark';
  }
};

const saveTheme = (theme) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore storage errors
  }
};

const applyTheme = (themeName) => {
  if (typeof window === 'undefined') return;
  const theme = THEMES[themeName];
  if (!theme) return;
  
  const root = document.documentElement;
  root.style.setProperty('--color-accent', theme.colors.accent);
  root.style.setProperty('--color-accent-rgb', theme.colors.accentRgb);
  root.style.setProperty('--color-accent-bright', theme.colors.accentBright);
  root.style.setProperty('--color-accent-bright-rgb', theme.colors.accentBrightRgb);
  root.style.setProperty('--color-note-active', theme.colors.noteActive);
  root.style.setProperty('--color-note-active-rgb', theme.colors.noteActiveRgb);
  root.style.setProperty('--color-note-inactive', theme.colors.noteInactive);
  root.style.setProperty('--color-background', theme.colors.background);
  root.style.setProperty('--color-panel', theme.colors.panel);
  root.style.setProperty('--color-text', theme.colors.text);
  root.style.setProperty('--color-text-muted', theme.colors.textMuted);
  root.style.setProperty('--color-playhead', `rgba(${theme.colors.accentRgb}, 0.85)`);
  root.style.setProperty('--color-grid-line', theme.colors.background === '#f5f7fa' 
    ? 'rgba(0, 0, 0, 0.08)' 
    : 'rgba(255, 255, 255, 0.12)');
  
  // Update body background
  if (themeName === 'light') {
    document.body.style.background = `radial-gradient(circle at top left, rgba(${theme.colors.accentRgb}, 0.12), transparent 50%), radial-gradient(circle at bottom right, rgba(${theme.colors.noteActiveRgb}, 0.10), transparent 50%), ${theme.colors.background}`;
  } else {
    document.body.style.background = `radial-gradient(circle at top left, rgba(${theme.colors.accentRgb}, 0.15), transparent 50%), radial-gradient(circle at bottom right, rgba(${theme.colors.noteActiveRgb}, 0.12), transparent 50%), ${theme.colors.background}`;
  }
  document.body.style.color = theme.colors.text;
};

const createThemeStore = () => {
  const initial = loadTheme();
  const store = writable(initial);
  const { subscribe, set } = store;
  
  // Apply initial theme
  if (typeof window !== 'undefined') {
    setTimeout(() => applyTheme(initial), 0);
  }
  
  return {
    subscribe,
    setTheme(themeName) {
      if (!THEMES[themeName]) return;
      set(themeName);
      saveTheme(themeName);
      applyTheme(themeName);
    },
    getThemes() {
      return Object.entries(THEMES).map(([key, value]) => ({
        id: key,
        name: value.name
      }));
    }
  };
};

export const theme = createThemeStore();
