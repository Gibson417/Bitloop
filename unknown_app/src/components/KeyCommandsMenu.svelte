<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { openMenu, setOpenMenu, closeAllMenus } from '../store/menuCoordinator.js';

  let keyCommandsMenuOpen = false;
  let keyCommandsMenuEl;

  // Subscribe to menu coordinator
  const unsubscribeMenuCoordinator = openMenu.subscribe((currentOpenMenu) => {
    keyCommandsMenuOpen = currentOpenMenu === 'keycommands';
  });

  const toggleKeyCommandsMenu = async (event) => {
    event?.stopPropagation?.();
    if (keyCommandsMenuOpen) {
      closeAllMenus();
    } else {
      setOpenMenu('keycommands');
    }
    
    if (!keyCommandsMenuOpen) {
      // Wait for next tick, then add the click listener
      await tick();
      setTimeout(() => {
        const currentOpen = keyCommandsMenuOpen;
        if (currentOpen) {
          document.addEventListener('click', closeOnClickOutside);
        }
      }, 0);
    }
  };

  const closeOnClickOutside = (event) => {
    const target = event.target;
    if (keyCommandsMenuEl && !keyCommandsMenuEl.contains(target)) {
      closeAllMenus();
      document.removeEventListener('click', closeOnClickOutside);
    }
  };

  const closeKeyCommandsMenu = () => {
    closeAllMenus();
    document.removeEventListener('click', closeOnClickOutside);
  };

  const handleModalContentClick = (event) => {
    event.stopPropagation();
  };

  const handleDocumentKeydown = (event) => {
    if (event.key === 'Escape' && keyCommandsMenuOpen) {
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
    unsubscribeMenuCoordinator();
  });
</script>

<div class="key-commands-menu" data-open={keyCommandsMenuOpen} bind:this={keyCommandsMenuEl} data-component="KeyCommandsMenu">
  <button
    type="button"
    class={`key-commands-btn ${keyCommandsMenuOpen ? 'open' : ''}`}
    on:click={toggleKeyCommandsMenu}
    aria-haspopup="true"
    aria-expanded={keyCommandsMenuOpen}
    aria-label="Keyboard Shortcuts"
    title="Keyboard Shortcuts"
  >
    <svg class="key-commands-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8"/>
    </svg>
  </button>

</div>

{#if keyCommandsMenuOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="modal-backdrop" on:click={closeKeyCommandsMenu}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-content" on:click={handleModalContentClick} role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
      <div class="modal-header">
        <h3 id="shortcuts-title">Keyboard Shortcuts</h3>
        <button
          type="button"
          class="close-btn"
          on:click={closeKeyCommandsMenu}
          aria-label="Close keyboard shortcuts"
        >
          <svg class="close-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="shortcuts-list">
        <div class="shortcut-section">
          <h4>Playback</h4>
          <div class="shortcut-item">
            <kbd>Space</kbd>
            <span>Play / Pause</span>
          </div>
        </div>
        
        <div class="shortcut-section">
          <h4>Editing</h4>
          <div class="shortcut-item">
            <kbd>Ctrl/Cmd + Z</kbd>
            <span>Undo</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl/Cmd + Y</kbd>
            <span>Redo</span>
          </div>
        </div>
        
        <div class="shortcut-section">
          <h4>Grid Navigation</h4>
          <div class="shortcut-item">
            <kbd>Arrow Keys</kbd>
            <span>Navigate grid cells</span>
          </div>
          <div class="shortcut-item">
            <kbd>Enter</kbd>
            <span>Toggle note at cursor</span>
          </div>
        </div>
        
        <div class="shortcut-section">
          <h4>General</h4>
          <div class="shortcut-item">
            <kbd>Esc</kbd>
            <span>Close dialogs/menus</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl/Cmd + Shift + D</kbd>
            <span>Toggle Dev Mode</span>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .key-commands-menu {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
  }

  .key-commands-btn {
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

  .key-commands-btn:hover:not(:disabled) {
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: rgba(var(--color-accent-rgb), 0.26);
    color: var(--color-text);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(var(--color-accent-rgb), 0.2);
  }

  .key-commands-btn:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .key-commands-btn.open {
    border-color: rgba(var(--color-accent-rgb), 0.65);
    background: rgba(var(--color-accent-rgb), 0.3);
  }

  .key-commands-icon {
    width: 20px;
    height: 20px;
    display: block;
  }

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal-content {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: var(--color-panel);
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
    min-width: 320px;
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  }

  .modal-header h3 {
    font-size: 1.1rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(var(--color-accent-rgb), 0.95);
    margin: 0;
  }

  .close-btn {
    min-width: 32px;
    min-height: 32px;
    padding: 6px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(0, 0, 0, 0.3);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    border-color: rgba(var(--color-accent-rgb), 0.5);
    background: rgba(var(--color-accent-rgb), 0.2);
    color: var(--color-text);
    transform: scale(1.05);
  }

  .close-btn:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .close-icon {
    width: 18px;
    height: 18px;
  }

  .shortcuts-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .shortcut-section h4 {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
    margin: 0 0 8px;
  }

  .shortcut-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    margin-bottom: 4px;
  }

  kbd {
    display: inline-block;
    padding: 4px 8px;
    font-size: 0.75rem;
    font-weight: 600;
    font-family: 'Courier New', monospace;
    color: rgba(var(--color-accent-rgb), 0.95);
    background: rgba(var(--color-accent-rgb), 0.12);
    border: 1px solid rgba(var(--color-accent-rgb), 0.3);
    border-radius: 4px;
    white-space: nowrap;
    min-width: 60px;
    text-align: center;
  }

  .shortcut-item span {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    flex: 1;
  }

  @media (max-width: 768px) {
    .key-commands-menu {
      align-items: stretch;
    }

    .modal-content {
      max-width: calc(100vw - 40px);
      min-width: auto;
    }
  }
</style>
