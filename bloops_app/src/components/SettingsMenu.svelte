<script>
  import { onDestroy, tick } from 'svelte';
  import ThemeSelector from './ThemeSelector.svelte';
  import HowToGuide from './HowToGuide.svelte';

  let settingsMenuOpen = false;
  let settingsMenuEl;
  let showGuide = false;

  const toggleSettingsMenu = async (event) => {
    event?.stopPropagation?.();
    settingsMenuOpen = !settingsMenuOpen;
    
    if (settingsMenuOpen) {
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
      settingsMenuOpen = false;
      document.removeEventListener('click', closeOnClickOutside);
    }
  };

  const closeSettingsMenu = () => {
    settingsMenuOpen = false;
    document.removeEventListener('click', closeOnClickOutside);
  };

  const openGuide = () => {
    showGuide = true;
    closeSettingsMenu();
  };

  const closeGuide = () => {
    showGuide = false;
  };

  const handleDocumentKeydown = (event) => {
    if (event.key === 'Escape' && settingsMenuOpen) {
      settingsMenuOpen = false;
      document.removeEventListener('click', closeOnClickOutside);
    }
  };

  // Add keyboard listener on mount
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', handleDocumentKeydown);
  }

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', closeOnClickOutside);
      document.removeEventListener('keydown', handleDocumentKeydown);
    }
  });
</script>

<div class="settings-menu" data-open={settingsMenuOpen} bind:this={settingsMenuEl}>
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
      <button 
        type="button" 
        class="menu-item how-to-btn"
        on:click={openGuide}
        role="menuitem"
      >
        <svg class="menu-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>How To / Guide</span>
      </button>
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
    width: 40px;
    height: 40px;
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
    color: #fff;
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
    background: rgba(12, 16, 24, 0.95);
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
    color: rgba(255, 255, 255, 0.9);
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

  @media (max-width: 768px) {
    .settings-menu {
      align-items: stretch;
    }

    .settings-dropdown {
      right: auto;
      left: 0;
    }
  }
</style>
