<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import ThemeSelector from './ThemeSelector.svelte';
  import HowToGuide from './HowToGuide.svelte';
  import { devMode } from '../store/devModeStore.js';
  import { resetAll } from '../lib/persistence.js';
  import { openMenu, setOpenMenu, closeAllMenus } from '../store/menuCoordinator.js';

  let settingsMenuOpen = false;
  let settingsMenuEl;
  let showGuide = false;
  let devModeEnabled = false;

  // Subscribe to dev mode store
  const unsubscribeDevMode = devMode.subscribe((value) => {
    devModeEnabled = value;
  });

  // Subscribe to menu coordinator
  const unsubscribeMenuCoordinator = openMenu.subscribe((currentOpenMenu) => {
    settingsMenuOpen = currentOpenMenu === 'settings';
  });

  const toggleSettingsMenu = async (event) => {
    event?.stopPropagation?.();
    const willBeOpen = !settingsMenuOpen;
    
    if (settingsMenuOpen) {
      closeAllMenus();
    } else {
      setOpenMenu('settings');
    }
    
    if (willBeOpen) {
      // Wait for next tick, then add the click listener
      await tick();
      setTimeout(() => {
        if (settingsMenuOpen) {
          document.addEventListener('click', closeOnClickOutside, { once: false });
        }
      }, 0);
    }
  };

  const closeOnClickOutside = (event) => {
    const target = event.target;
    if (settingsMenuEl && !settingsMenuEl.contains(target)) {
      closeAllMenus();
      document.removeEventListener('click', closeOnClickOutside);
    }
  };

  const closeSettingsMenu = () => {
    closeAllMenus();
    document.removeEventListener('click', closeOnClickOutside);
  };

  const openGuide = () => {
    showGuide = true;
    closeSettingsMenu();
  };

  const closeGuide = () => {
    showGuide = false;
  };

  const toggleDevMode = () => {
    devMode.toggle();
  };

  const resetApp = async () => {
    if (confirm('Are you sure you want to reset the app? This will clear all data and reload.')) {
      try {
        // Clear IndexedDB (projects, library, etc.)
        await resetAll();
        // Clear localStorage (theme, dev mode, etc.)
        localStorage.clear();
        // Reload the page to reset all in-memory state
        window.location.reload();
      } catch (error) {
        console.error('Error resetting app:', error);
        // Even if there's an error, still try to clear localStorage and reload
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  const handleDocumentKeydown = (event) => {
    if (event.key === 'Escape' && settingsMenuOpen) {
      event.preventDefault();
      event.stopPropagation();
      closeAllMenus();
      document.removeEventListener('click', closeOnClickOutside);
    }
  };

  // Add keyboard listener in onMount to ensure proper lifecycle management
  onMount(() => {
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', handleDocumentKeydown);
    }
  });

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', closeOnClickOutside);
      document.removeEventListener('keydown', handleDocumentKeydown);
    }
    unsubscribeDevMode();
    unsubscribeMenuCoordinator();
  });
</script>

<div class="settings-menu" data-open={settingsMenuOpen} bind:this={settingsMenuEl} data-component="SettingsMenu">
  <button
    type="button"
    class={`settings-btn ${settingsMenuOpen ? 'open' : ''}`}
    on:click={toggleSettingsMenu}
    aria-haspopup="true"
    aria-expanded={settingsMenuOpen}
    aria-label="Settings"
    title="Settings"
  >
    <svg class="settings-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v6m0 6v6M1 12h6m6 0h6"/>
      <path d="m4.93 4.93 4.24 4.24m5.66 0 4.24-4.24m0 14.14-4.24-4.24m-5.66 0-4.24 4.24"/>
    </svg>
  </button>
  {#if settingsMenuOpen}
    <div class="settings-dropdown" role="menu">
      <div class="settings-section">
        <ThemeSelector />
      </div>
      <div class="settings-divider"></div>
      <div class="settings-section button-row">
        <button 
          type="button" 
          class="menu-item toggle-btn"
          class:active={devModeEnabled}
          on:click={toggleDevMode}
          role="menuitemcheckbox"
          aria-checked={devModeEnabled}
          title="Toggle Dev Mode {devModeEnabled ? 'OFF' : 'ON'}"
          aria-label="Toggle Dev Mode {devModeEnabled ? 'OFF' : 'ON'}"
        >
          <svg class="menu-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
          <span>{devModeEnabled ? 'Dev Mode: ON' : 'Dev Mode: OFF'}</span>
        </button>
        <button 
          type="button" 
          class="menu-item reset-btn"
          on:click={resetApp}
          role="menuitem"
          title="Reset App"
          aria-label="Reset App"
        >
          <svg class="menu-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          <span>Reset App</span>
        </button>
      </div>
    </div>
  {/if}
</div>

{#if showGuide}
  <HowToGuide on:close={closeGuide} />
{/if}

<style>
  .settings-menu {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
  }

  .settings-btn {
    width: 44px; /* WCAG 2.2 AA touch target minimum */
    height: 44px;
    border-radius: 10px;
    border: 1px solid rgba(var(--color-accent-rgb), 0.4);
    background: rgba(var(--color-accent-rgb), 0.16);
    color: rgba(var(--color-accent-rgb), 0.9);
    font-size: 1.25rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .settings-btn:hover:not(:disabled) {
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: rgba(var(--color-accent-rgb), 0.26);
    color: var(--color-text);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(var(--color-accent-rgb), 0.2);
  }

  .settings-btn:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .settings-btn.open {
    border-color: rgba(var(--color-accent-rgb), 0.65);
    background: rgba(var(--color-accent-rgb), 0.3);
  }

  .settings-icon {
    width: 20px;
    height: 20px;
    display: block;
  }

  .settings-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: var(--color-panel);
    backdrop-filter: blur(10px);
    box-shadow: 0 18px 36px rgba(0, 0, 0, 0.35);
    min-width: 220px;
    z-index: 20;
  }

  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* Center theme selector in first section */
  .settings-section:first-of-type {
    align-items: center;
  }

  /* Button row layout for side-by-side buttons */
  .settings-section.button-row {
    flex-direction: row;
    gap: 8px;
  }

  /* Buttons in row should flex to share space */
  .settings-section.button-row .menu-item {
    flex: 1;
    min-width: 0; /* Allow buttons to shrink below content width */
  }

  /* Adjust text handling for button labels */
  .settings-section.button-row .menu-item span {
    white-space: nowrap;
  }

  .section-title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
    padding: 0 4px;
  }

  .settings-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
    margin: 4px 0;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 12px 14px;
    border: 1px solid rgba(var(--color-accent-rgb), 0.2);
    border-radius: 8px;
    background: rgba(var(--color-accent-rgb), 0.05);
    color: var(--color-text);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: left;
  }

  .menu-icon {
    width: 18px;
    height: 18px;
    color: rgba(var(--color-accent-rgb), 0.8);
    flex-shrink: 0;
    transition: color 0.2s ease;
  }

  .menu-item:hover {
    background: rgba(var(--color-accent-rgb), 0.12);
    border-color: rgba(var(--color-accent-rgb), 0.35);
    transform: translateX(2px);
  }

  .menu-item:hover .menu-icon {
    color: rgba(var(--color-accent-rgb), 1);
  }

  .menu-item:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.6);
    outline-offset: 2px;
  }

  .menu-item:active {
    transform: translateX(0);
  }

  .menu-item.toggle-btn.active {
    background: rgba(var(--color-accent-rgb), 0.2);
    border-color: rgba(var(--color-accent-rgb), 0.5);
  }

  .menu-item.toggle-btn.active .menu-icon {
    color: rgba(var(--color-accent-rgb), 1);
  }

  .menu-item.reset-btn {
    border-color: rgba(255, 100, 100, 0.2);
    background: rgba(255, 100, 100, 0.05);
  }

  .menu-item.reset-btn:hover {
    background: rgba(255, 100, 100, 0.12);
    border-color: rgba(255, 100, 100, 0.35);
  }

  .menu-item.reset-btn .menu-icon {
    color: rgba(255, 120, 120, 0.8);
  }

  .menu-item.reset-btn:hover .menu-icon {
    color: rgba(255, 120, 120, 1);
  }

  @media (max-width: 768px) {
    .settings-menu {
      align-items: stretch;
    }

    .settings-dropdown {
      right: auto;
      left: 0;
      max-width: calc(100vw - 32px); /* Ensure dropdown doesn't exceed viewport width with padding */
      min-width: auto; /* Override min-width on mobile */
      width: max-content; /* Fit content width */
    }

    /* Stack buttons vertically on very small screens */
    .settings-section.button-row {
      flex-direction: column;
      gap: 12px;
    }

    /* Allow text to wrap on mobile */
    .settings-section.button-row .menu-item span {
      white-space: normal;
    }
  }
</style>
