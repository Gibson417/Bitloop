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
      accent: '#28a88f',
      accentRgb: '40, 168, 143',
      accentBright: '#35D4B4',
      accentBrightRgb: '53, 212, 180',
      noteActive: '#2890d8',
      noteActiveRgb: '40, 144, 216',
      noteInactive: '#b8bcc4',
      background: '#f5f7fa',
      panel: '#ffffff',
      text: '#1a1d24',
      textMuted: 'rgba(26, 29, 36, 0.7)'
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
