<script>
  import { onDestroy, onMount } from 'svelte';
  import ThemeSelector from './ThemeSelector.svelte';

  let settingsMenuOpen = false;
  let settingsMenuEl;

  const toggleSettingsMenu = (event) => {
    event?.stopPropagation?.();
    settingsMenuOpen = !settingsMenuOpen;
  };

  const closeSettingsMenu = () => {
    settingsMenuOpen = false;
  };

  const handleDocumentClick = (event) => {
    if (!settingsMenuOpen) return;
    const target = event.target;
    if (typeof Element !== 'undefined' && target instanceof Element) {
      if (!settingsMenuEl?.contains(target)) {
        settingsMenuOpen = false;
      }
    } else {
      settingsMenuOpen = false;
    }
  };

  const handleDocumentKeydown = (event) => {
    if (event.key === 'Escape' && settingsMenuOpen) {
      settingsMenuOpen = false;
    }
  };

  onMount(() => {
    if (typeof document !== 'undefined') {
      document.addEventListener('click', handleDocumentClick);
      document.addEventListener('keydown', handleDocumentKeydown);
    }
  });

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', handleDocumentClick);
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
    </div>
  {/if}
</div>

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
