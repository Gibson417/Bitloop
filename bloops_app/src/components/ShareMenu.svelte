<script>
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';

  export let shareStatus = 'idle';
  export let shareMessage = '';
  export let shareLink = '';

  const dispatch = createEventDispatcher();

  let shareMenuOpen = false;
  let shareMenuEl;
  let importInput;

  const toggleShareMenu = (event) => {
    event?.stopPropagation?.();
    shareMenuOpen = !shareMenuOpen;
  };

  const closeShareMenu = () => {
    shareMenuOpen = false;
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

  const handleDocumentClick = (event) => {
    if (!shareMenuOpen) return;
    const target = event.target;
    if (typeof Element !== 'undefined' && target instanceof Element) {
      if (!shareMenuEl?.contains(target)) {
        shareMenuOpen = false;
      }
    } else {
      shareMenuOpen = false;
    }
  };

  const handleDocumentKeydown = (event) => {
    if (event.key === 'Escape' && shareMenuOpen) {
      shareMenuOpen = false;
    }
  };

  const handleShareLinkFocus = (event) => {
    event.target.select?.();
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

<div class="share-menu" data-open={shareMenuOpen} bind:this={shareMenuEl}>
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
    <span class="share-icon" aria-hidden="true">🔗</span>
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
    opacity: 0.35;
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
    font-size: 1.25rem;
    line-height: 1;
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
    background: rgba(12, 16, 24, 0.9);
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
