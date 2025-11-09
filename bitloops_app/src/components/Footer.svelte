<script>
  import { createEventDispatcher } from 'svelte';

  export let projects = [];
  export let currentId = null;
  export let shareStatus = 'idle';
  export let shareMessage = '';
  export let shareLink = '';

  const dispatch = createEventDispatcher();
  let fileInput;
  let selectedProjectId = currentId ?? '';
  let showExportMenu = false;

  const handleExport = () => {
    dispatch('export');
    showExportMenu = false;
  };

  const handleImportClick = () => {
    fileInput?.click();
    showExportMenu = false;
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      dispatch('import', { json: text });
    } finally {
      event.target.value = '';
    }
  };

  const handleSelectProject = (event) => dispatch('selectproject', { id: event.target.value });
  const handleNewProject = () => dispatch('newproject');
  const handleDuplicateProject = () => dispatch('duplicateproject');
  const handleDeleteProject = () => dispatch('deleteproject');
  const handleRender = () => {
    dispatch('render');
    showExportMenu = false;
  };
  const handleRenderMidi = () => {
    dispatch('rendermidi');
    showExportMenu = false;
  };
  const handleShare = () => {
    dispatch('share');
    showExportMenu = false;
  };

  const toggleExportMenu = () => {
    showExportMenu = !showExportMenu;
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
  <div class="action-column">
    <div class="export-menu-container">
      <button class="export-toggle icon-only" type="button" on:click={toggleExportMenu} title="Share or Export" aria-label="Share or Export">
        <span>📤</span>
      </button>
      {#if showExportMenu}
        <div class="export-dropdown">
          <button class="menu-item" type="button" on:click={handleShare}>
            <span class="menu-icon">🔗</span>
            <span>Share loop</span>
          </button>
          <button class="menu-item" type="button" on:click={handleRender}>
            <span class="menu-icon">🎵</span>
            <span>Render WAV</span>
          </button>
          <button class="menu-item" type="button" on:click={handleRenderMidi}>
            <span class="menu-icon">🎹</span>
            <span>Render MIDI</span>
          </button>
          <button class="menu-item" type="button" on:click={handleExport}>
            <span class="menu-icon">📄</span>
            <span>Export JSON</span>
          </button>
          <button class="menu-item" type="button" on:click={handleImportClick}>
            <span class="menu-icon">📥</span>
            <span>Import JSON</span>
          </button>
        </div>
      {/if}
    </div>
    {#if shareStatus !== 'idle'}
      <div class={`share-feedback ${shareStatus}`}>
        <span>{shareMessage}</span>
        {#if shareLink}
          <input
            class="share-link"
            type="text"
            readonly
            value={shareLink}
            on:focus={(event) => event.target.select()}
          />
        {/if}
      </div>
    {/if}
    <input type="file" accept=".json,.bitloops.json" bind:this={fileInput} on:change={handleImport} hidden />
  </div>
</footer>

<style>
  .footer {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 28px;
    padding: 24px 32px 32px;
    color: rgba(255, 255, 255, 0.85);
  }

  .project-column,
  .action-column {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .field label {
    color: rgba(255, 255, 255, 0.58);
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
  }

  .library-actions button,
  .action-column button {
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.3);
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 0.75rem;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border 0.2s ease;
  }

  .library-actions button:hover,
  .action-column button:hover {
    transform: translateY(-2px);
    border-color: rgba(var(--color-accent-rgb), 0.5);
  }

  .library-actions button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  .action-column {
    align-items: stretch;
    gap: 16px;
  }

  .export-menu-container {
    position: relative;
  }

  .export-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    justify-content: center;
  }

  .export-toggle.icon-only {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    padding: 0;
    border: 1px solid rgba(var(--color-accent-rgb), 0.7);
    background: rgba(var(--color-accent-rgb), 0.28);
    box-shadow: 0 18px 42px rgba(var(--color-accent-rgb), 0.35);
  }

  .export-toggle.icon-only span {
    font-size: 1.4rem;
  }

  .export-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 8px;
    background: rgba(14, 16, 22, 0.98);
    border: 1px solid rgba(var(--color-accent-rgb), 0.3);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    z-index: 100;
  }

  .menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    color: #fff;
    text-align: left;
    cursor: pointer;
    transition: background 0.2s ease;
    font-size: 0.9rem;
    letter-spacing: 0.04em;
  }

  .menu-item:last-child {
    border-bottom: none;
  }

  .menu-item:hover {
    background: rgba(var(--color-accent-rgb), 0.15);
  }

  .menu-icon {
    font-size: 1.2rem;
    width: 24px;
    text-align: center;
  }

  .primary-actions,
  .export-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .primary {
    border: 1px solid rgba(var(--color-accent-rgb), 0.7);
    background: rgba(var(--color-accent-rgb), 0.28);
    box-shadow: 0 18px 42px rgba(var(--color-accent-rgb), 0.35);
  }

  .secondary {
    border: 1px solid rgba(var(--color-note-active-rgb), 0.55);
    background: rgba(var(--color-note-active-rgb), 0.18);
    box-shadow: 0 14px 32px rgba(var(--color-note-active-rgb), 0.3);
  }

  .ghost {
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.05);
  }

  .share-feedback {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.7);
    padding: 12px 14px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.38);
    border: 1px solid rgba(255, 255, 255, 0.14);
  }

  .share-feedback.copied,
  .share-feedback.shared,
  .share-feedback.loaded {
    border-color: rgba(var(--color-accent-rgb), 0.5);
    color: #fff;
  }

  .share-feedback.error {
    border-color: rgba(255, 99, 132, 0.7);
    color: rgba(255, 199, 206, 0.95);
  }

  .share-link {
    width: 100%;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 10px;
    padding: 8px 10px;
    color: #fff;
    font-size: 0.75rem;
    letter-spacing: 0.04em;
  }

  .share-link:focus {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.4);
    outline-offset: 2px;
  }

  @media (max-width: 720px) {
    .footer {
      grid-template-columns: 1fr;
    }
    
    .project-column {
      order: 1;
    }

    .action-column {
      order: 2;
      flex-direction: column;
      gap: 16px;
    }

    .primary-actions,
    .export-actions {
      width: 100%;
    }
  }
</style>
