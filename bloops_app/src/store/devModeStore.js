import { writable } from 'svelte/store';

const DEV_MODE_KEY = 'unknown-dev-mode';

const loadDevMode = () => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(DEV_MODE_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
};

const saveDevMode = (enabled) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEV_MODE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore storage errors
  }
};

const createDevModeStore = () => {
  const initial = loadDevMode();
  const store = writable(initial);
  const { subscribe, set } = store;
  
  return {
    subscribe,
    toggle() {
      let current;
      store.update((value) => {
        current = !value;
        return current;
      });
      saveDevMode(current);
      return current;
    },
    enable() {
      set(true);
      saveDevMode(true);
    },
    disable() {
      set(false);
      saveDevMode(false);
    }
  };
};

export const devMode = createDevModeStore();
