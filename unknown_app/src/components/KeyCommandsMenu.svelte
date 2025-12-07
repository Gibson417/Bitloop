<script>
  import { onMount, onDestroy, tick } from 'svelte';

  let keyCommandsMenuOpen = false;
  let keyCommandsMenuEl;

  const toggleKeyCommandsMenu = async (event) => {
    event?.stopPropagation?.();
    keyCommandsMenuOpen = !keyCommandsMenuOpen;
    
    if (keyCommandsMenuOpen) {
      // Wait for next tick, then add the click listener
      await tick();
      setTimeout(() => {
        if (keyCommandsMenuOpen) {
          document.addEventListener('click', closeOnClickOutside, { once: false });
        }
      }, 0);
    }
  };

  const closeOnClickOutside = (event) => {
    const target = event.target;
    if (keyCommandsMenuEl && !keyCommandsMenuEl.contains(target)) {
      keyCommandsMenuOpen = false;
      document.removeEventListener('click', closeOnClickOutside);
    }
  };

  const closeKeyCommandsMenu = () => {
    keyCommandsMenuOpen = false;
    document.removeEventListener('click', closeOnClickOutside);
  };

  const handleDocumentKeydown = (event) => {
    if (event.key === 'Escape' && keyCommandsMenuOpen) {
      event.preventDefault();
      event.stopPropagation();
      keyCommandsMenuOpen = false;
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
  {#if keyCommandsMenuOpen}
    <div class="key-commands-dropdown" role="menu">
      <div class="dropdown-header">
        <h3>Keyboard Shortcuts</h3>
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
  {/if}
</div>

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

  .key-commands-dropdown {
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
    min-width: 320px;
    max-width: 400px;
    max-height: 70vh;
    overflow-y: auto;
    z-index: 20;
  }

  .dropdown-header {
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  }

  .dropdown-header h3 {
    font-size: 0.95rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(var(--color-accent-rgb), 0.95);
    margin: 0;
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

    .key-commands-dropdown {
      right: auto;
      left: 0;
      max-width: calc(100vw - 32px);
      min-width: auto;
      width: max-content;
    }
  }
</style>
