<script>
  import { createEventDispatcher, onMount, onDestroy, tick } from 'svelte';

  export let shareStatus = 'idle';
  export let shareMessage = '';
  export let shareLink = '';

  const dispatch = createEventDispatcher();

  let shareMenuOpen = false;
  let shareMenuEl;
  let importInput;

  const toggleShareMenu = async (event) => {
    event?.stopPropagation?.();
    shareMenuOpen = !shareMenuOpen;
    
    if (shareMenuOpen) {
      // Wait for next tick, then add the click listener
      await tick();
      setTimeout(() => {
        if (shareMenuOpen) {
          document.addEventListener('click', closeOnClickOutside, { once: false });
        }
      }, 0);
    }
  };

  const closeOnClickOutside = (event) => {
    const target = event.target;
    if (shareMenuEl && !shareMenuEl.contains(target)) {
      shareMenuOpen = false;
      document.removeEventListener('click', closeOnClickOutside);
    }
  };

  const closeShareMenu = () => {
    shareMenuOpen = false;
    document.removeEventListener('click', closeOnClickOutside);
  };

  const handleShare = () => {
    closeShareMenu();
    dispatch('share');
  };

  const handleRenderWav = () => {
    closeShareMenu();
    dispatch('render');
  };

  const handleRenderMidi = () => {
    closeShareMenu();
    dispatch('rendermidi');
  };

  const handleExport = () => {
    closeShareMenu();
    dispatch('export');
  };

  const triggerImport = () => {
    if (importInput) {
      importInput.value = '';
      importInput.click();
    }
  };

  const handleImportChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    closeShareMenu();
    dispatch('import', { file });
    event.target.value = '';
  };

  const handleDocumentKeydown = (event) => {
    if (event.key === 'Escape' && shareMenuOpen) {
      event.preventDefault();
      event.stopPropagation();
      shareMenuOpen = false;
      document.removeEventListener('click', closeOnClickOutside);
    }
  };

  const handleShareLinkFocus = (event) => {
    event.target.select?.();
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

<div class="share-menu" data-open={shareMenuOpen} bind:this={shareMenuEl} data-component="ShareMenu">
  <button
    type="button"
    class={`share-btn ${shareStatus === 'working' ? 'loading' : ''} ${shareMenuOpen ? 'open' : ''}`}
    on:click={toggleShareMenu}
    disabled={shareStatus === 'working'}
    aria-haspopup="true"
    aria-expanded={shareMenuOpen}
    aria-label="Share or Export"
    title="Share or Export"
  >
    <svg class="share-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  </button>
  {#if shareMenuOpen}
    <div class="share-dropdown" role="menu">
      <button type="button" role="menuitem" on:click={handleShare} disabled={shareStatus === 'working'}>
        <span>Share loop</span>
      </button>
      <button type="button" role="menuitem" on:click={handleRenderWav}>
        <span>Render WAV</span>
      </button>
      <button type="button" role="menuitem" on:click={handleRenderMidi}>
        <span>Render MIDI</span>
      </button>
      <button type="button" role="menuitem" on:click={handleExport}>
        <span>Export JSON</span>
      </button>
      <button type="button" role="menuitem" on:click={triggerImport}>
        <span>Import JSON</span>
      </button>
    </div>
  {/if}
  <input
    type="file"
    accept=".json,.bloops.json"
    bind:this={importInput}
    on:change={handleImportChange}
    hidden
  />
  {#if shareStatus !== 'idle'}
    <div class={`share-feedback ${shareStatus}`}>
      <span>{shareMessage}</span>
      {#if shareLink}
        <input class="share-link" type="text" readonly value={shareLink} on:focus={handleShareLinkFocus} />
      {/if}
    </div>
  {/if}
</div>

<style>
  .share-menu {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
  }

  .share-btn {
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

  .share-btn:hover:not(:disabled) {
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: rgba(var(--color-accent-rgb), 0.26);
    color: #fff;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(var(--color-accent-rgb), 0.2);
  }

  .share-btn:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .share-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    color: rgba(255, 255, 255, 0.4);
    border-color: rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.05);
  }

  .share-btn.loading {
    cursor: progress;
  }

  .share-btn.open {
    border-color: rgba(var(--color-accent-rgb), 0.65);
    background: rgba(var(--color-accent-rgb), 0.3);
  }

  .share-icon {
    width: 20px;
    height: 20px;
    display: block;
  }

  .share-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: var(--color-panel);
    box-shadow: 0 18px 36px rgba(0, 0, 0, 0.35);
    min-width: 220px;
    z-index: 20;
  }

  .share-dropdown button {
    padding: 12px 14px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: rgba(255, 255, 255, 0.04);
    color: #fff;
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.15s ease, border 0.15s ease, background 0.15s ease;
  }

  .share-dropdown button:hover {
    transform: translateX(2px);
    border-color: rgba(var(--color-accent-rgb), 0.45);
    background: rgba(var(--color-accent-rgb), 0.14);
  }

  .share-dropdown button:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.75);
    outline-offset: 2px;
  }

  .share-dropdown button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .share-feedback {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.8);
  }

  .share-feedback.error {
    color: #ffb3b3;
  }

  .share-feedback.shared,
  .share-feedback.copied,
  .share-feedback.ready,
  .share-feedback.loaded {
    color: rgba(var(--color-accent-rgb), 0.95);
  }

  .share-link {
    width: 100%;
    max-width: 320px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid rgba(var(--color-accent-rgb), 0.35);
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    font-size: 0.8rem;
    letter-spacing: 0.04em;
  }

  .share-link:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.85);
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    .share-menu {
      align-items: stretch;
    }

    .share-feedback {
      align-items: stretch;
    }

    .share-dropdown {
      right: auto;
      left: 0;
    }
  }
</style>
