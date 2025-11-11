<script>
  import { onDestroy } from 'svelte';
  import { theme } from '../store/themeStore.js';

  let currentTheme = 'dark';
  let themes = theme.getThemes();
  let menuOpen = false;
  let selectRef;

  const unsubscribe = theme.subscribe((value) => {
    currentTheme = value;
  });

  const toggleMenu = (event) => {
    event?.stopPropagation?.();
    menuOpen = !menuOpen;
    if (menuOpen) {
      queueMicrotask(() => {
        selectRef?.focus();
      });
    }
  };

  const closeMenu = () => {
    menuOpen = false;
  };

  const handleThemeChange = (event) => {
    theme.setTheme(event.target.value);
    closeMenu();
  };

  const handleWindowClick = (event) => {
    if (!menuOpen) return;
    const target = event.target;
    if (typeof Element !== 'undefined' && target instanceof Element) {
      if (!target.closest('.theme-toggle')) {
        closeMenu();
      }
    } else {
      closeMenu();
    }
  };

  const handleWindowKeydown = (event) => {
    if (event.key === 'Escape' && menuOpen) {
      closeMenu();
    }
  };

  onDestroy(() => {
    unsubscribe?.();
  });
</script>

<svelte:window on:click={handleWindowClick} on:keydown={handleWindowKeydown} />

<div class="theme-toggle">
  <button
    type="button"
    class={`theme-trigger ${menuOpen ? 'open' : ''}`}
    on:click={toggleMenu}
    aria-haspopup="true"
    aria-expanded={menuOpen}
    aria-controls="theme-menu"
    aria-label="Theme settings"
  >
    <span class="icon" aria-hidden="true">⚙</span>
    <span class="visually-hidden">Theme settings</span>
  </button>
    {#if menuOpen}
      <div class="theme-menu" id="theme-menu" role="dialog">
        <label for="theme-select" class="label">Theme</label>
        <select
          id="theme-select"
          bind:value={currentTheme}
          on:change={handleThemeChange}
          class="theme-select"
          bind:this={selectRef}
        >
          {#each themes as themeOption}
            <option value={themeOption.id}>{themeOption.name}</option>
          {/each}
        </select>
      </div>
    {/if}
</div>

<style>
  .theme-toggle {
    position: relative;
    display: inline-flex;
  }

  .theme-trigger {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: 1px solid rgba(var(--color-accent-rgb), 0.4);
    background: rgba(var(--color-accent-rgb), 0.16);
    color: rgba(var(--color-accent-rgb), 0.9);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;
  }

  .theme-trigger:hover,
  .theme-trigger.open {
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: rgba(var(--color-accent-rgb), 0.26);
    color: #fff;
    box-shadow: 0 4px 12px rgba(var(--color-accent-rgb), 0.2);
    transform: translateY(-1px);
  }

  .theme-trigger:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .icon {
    font-size: 1.25rem;
    line-height: 1;
  }

  .theme-menu {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    min-width: 180px;
    padding: 14px 16px 16px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(10, 12, 18, 0.95);
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.35);
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 30;
  }

  .label {
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted, rgba(255, 255, 255, 0.6));
  }

  .theme-select {
    background: rgba(0, 0, 0, 0.35);
    color: var(--color-text, #fff);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    padding: 8px 12px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
  }

  .theme-select:focus {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.5);
    outline-offset: 2px;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  
</style>
