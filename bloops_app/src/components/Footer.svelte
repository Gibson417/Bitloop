<script>
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';

  export let projects = [];
  export let currentId = null;
  export let shareStatus = 'idle';
  export let shareMessage = '';
  export let shareLink = '';

  const dispatch = createEventDispatcher();
  let selectedProjectId = currentId ?? '';
  let shareMenuOpen = false;
  let shareMenuEl;
  let importInput;

  const handleSelectProject = (event) => dispatch('selectproject', { id: event.target.value });
  const handleNewProject = () => dispatch('newproject');
  const handleDuplicateProject = () => dispatch('duplicateproject');
  const handleDeleteProject = () => dispatch('deleteproject');

  const toggleShareMenu = (event) => {
    event?.stopPropagation?.();
    shareMenuOpen = !shareMenuOpen;
  };

  const closeShareMenu = () => {
    shareMenuOpen = false;
  };

  const handleShare = async () => {
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

  const handleShareLinkFocus = (event) => {
    event.target.select?.();
  };

  $: selectedProjectId = currentId ?? '';
</script>

<footer class="footer">
  <div class="project-column">
    <div class="field session-field">
      <label for="project-select">Sessions</label>
      <div class="select-shell">
        <select id="project-select" bind:value={selectedProjectId} on:change={handleSelectProject}>
          {#if !projects.length}
            <option value="" disabled>No saved sessions</option>
          {:else}
            {#each projects as option}
              <option value={option.id}>{option.name}</option>
            {/each}
          {/if}
        </select>
      </div>
      <div class="library-actions">
        <button type="button" on:click={handleNewProject}>New</button>
        <button type="button" on:click={handleDuplicateProject} disabled={!selectedProjectId}>Duplicate</button>
        <button type="button" on:click={handleDeleteProject} disabled={projects.length <= 1}>Delete</button>
      </div>
    </div>
  </div>
  <div class="share-column">
    <div
      class="share-menu"
      role="presentation"
      tabindex="-1"
      on:click|stopPropagation
      on:keydown|stopPropagation
      bind:this={shareMenuEl}
    >
      <button
        type="button"
        class={`share-btn ${shareStatus === 'working' ? 'loading' : ''} ${shareMenuOpen ? 'open' : ''}`}
        on:click={toggleShareMenu}
        disabled={shareStatus === 'working'}
        aria-haspopup="true"
        aria-expanded={shareMenuOpen}
        aria-label="Share or Export"
      >
        <span class="share-icon" aria-hidden="true">🔗</span>
        <span>Share or Export</span>
        <span class="share-caret" aria-hidden="true">▾</span>
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
    </div>
    {#if shareStatus !== 'idle'}
      <div class={`share-feedback ${shareStatus}`}>
        <span>{shareMessage}</span>
        {#if shareLink}
          <input class="share-link" type="text" readonly value={shareLink} on:focus={handleShareLinkFocus} />
        {/if}
      </div>
    {/if}
  </div>
</footer>

<style>
  .footer {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
    padding: 14px 24px 18px;
    color: rgba(255, 255, 255, 0.85);
    box-sizing: border-box;
    width: 100%;
    align-items: start;
  }

  .project-column,
  .share-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .field label {
    color: rgba(255, 255, 255, 0.7);
  }

  .select-shell select {
    width: 100%;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    padding: 10px 14px;
    color: #fff;
    font-size: 0.95rem;
  }

  .library-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .library-actions button,
  .share-btn,
  .share-dropdown button {
    padding: 14px 18px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(0, 0, 0, 0.35);
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border 0.2s ease;
  }

  .library-actions button:hover,
  .share-btn:hover,
  .share-dropdown button:hover {
    transform: translateY(-2px);
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: rgba(0, 0, 0, 0.45);
    box-shadow: 0 4px 12px rgba(var(--color-accent-rgb), 0.25);
  }

  .library-actions button:focus-visible,
  .share-btn:focus-visible,
  .share-dropdown button:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .library-actions button:disabled,
  .share-btn:disabled,
  .share-dropdown button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  .share-menu {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .share-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .share-btn.open {
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: rgba(0, 0, 0, 0.45);
  }

  .share-dropdown {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    background: rgba(15, 16, 24, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 180px;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
    z-index: 10;
  }

  .share-dropdown button {
    width: 100%;
    justify-content: flex-start;
    gap: 8px;
  }

  .share-icon,
  .share-caret {
    font-size: 0.9rem;
  }

  .share-feedback {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 0.8rem;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    padding: 12px 16px;
  }

  .share-feedback.error {
    border-color: rgba(255, 94, 94, 0.6);
    color: #ffb0b0;
  }

  .share-feedback.copied {
    border-color: rgba(var(--color-accent-rgb), 0.6);
  }

  .share-link {
    width: 100%;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.45);
    color: #fff;
    font-family: inherit;
    font-size: 0.85rem;
  }

  .share-link:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  @media (max-width: 720px) {
    .footer {
      grid-template-columns: 1fr;
    }

    .share-dropdown {
      right: auto;
      left: 0;
    }
  }
</style>
