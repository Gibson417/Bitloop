<script>
  import { createEventDispatcher } from 'svelte';

  export let name = 'Untitled loop';
  export let bars = 4;
  export let stepsPerBar = 16;
  export let bpm = 120;
  export let loopSeconds = 0;
  export let maxBars = 64;
  export let canUndo = false;
  export let canRedo = false;
  export let projects = [];
  export let currentId = null;
  export let isSaving = false;
  export let shareStatus = 'idle';
  export let shareMessage = '';
  export let shareLink = '';

  const dispatch = createEventDispatcher();
  let fileInput;
  let selectedProjectId = currentId ?? '';

  const handleBarsChange = (event) => {
    const value = Number(event.target.value);
    dispatch('changebars', { value });
  };

  const handleStepsChange = (event) => {
    const value = Number(event.target.value);
    dispatch('changesteps', { value });
  };

  const handleExport = () => {
    dispatch('export');
  };

  const handleImportClick = () => {
    fileInput?.click();
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

  const handleUndo = () => dispatch('undo');
  const handleRedo = () => dispatch('redo');
  const handleRename = (event) => dispatch('renameproject', { value: event.target.value });
  const handleSelectProject = (event) => dispatch('selectproject', { id: event.target.value });
  const handleNewProject = () => dispatch('newproject');
  const handleDuplicateProject = () => dispatch('duplicateproject');
  const handleDeleteProject = () => dispatch('deleteproject');
  const handleRender = () => dispatch('render');
  const handleShare = () => dispatch('share');

  $: selectedProjectId = currentId ?? '';
</script>

<footer class="footer">
  <div class="project-column">
    <div class="field name-field">
      <label for="project-name">Project name</label>
      <input id="project-name" type="text" value={name} on:change={handleRename} />
      <span class={`status ${isSaving ? 'saving' : ''}`}>{isSaving ? 'Saving…' : 'Saved'}</span>
    </div>
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
    <div class="history-actions">
      <button type="button" on:click={handleUndo} disabled={!canUndo}>Undo</button>
      <button type="button" on:click={handleRedo} disabled={!canRedo}>Redo</button>
    </div>
  </div>
  <div class="timeline-column">
    <div class="timing">
      <div class="field">
        <label for="bars">Bars</label>
        <div class="input-shell">
          <input
            id="bars"
            type="number"
            min="1"
            max={maxBars}
            value={bars}
            on:change={handleBarsChange}
          />
          <span class="hint">Max {maxBars}</span>
        </div>
      </div>
      <div class="field">
        <label for="steps">Steps / bar</label>
        <div class="input-shell">
          <input
            id="steps"
            type="number"
            min="4"
            max="64"
            step="1"
            value={stepsPerBar}
            on:change={handleStepsChange}
          />
        </div>
      </div>
      <div class="loop-card">
        <span class="loop-label">Loop</span>
        <span class="loop-value">{loopSeconds.toFixed(1)} s</span>
        <span class="loop-sub">{bpm} BPM</span>
      </div>
    </div>
  </div>
  <div class="action-column">
    <div class="primary-actions">
      <button class="primary" type="button" on:click={handleRender}>Render WAV</button>
      <button class="secondary" type="button" on:click={handleShare}>Share loop</button>
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
    <div class="export-actions">
      <button class="ghost" type="button" on:click={handleExport}>Export JSON</button>
      <button class="ghost" type="button" on:click={handleImportClick}>Import</button>
    </div>
    <input type="file" accept=".json,.bitloops.json" bind:this={fileInput} on:change={handleImport} hidden />
  </div>
</footer>

<style>
  .footer {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 24px;
    padding: 24px 32px 32px;
    color: rgba(255, 255, 255, 0.85);
  }

  .project-column,
  .timeline-column,
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

  .name-field input {
    background: rgba(0, 0, 0, 0.35);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 10px 14px;
    color: #fff;
    font-size: 1rem;
  }

  .name-field input:focus {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.5);
    outline-offset: 2px;
  }

  .status {
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.5);
  }

  .status.saving {
    color: rgba(var(--color-accent-rgb), 0.85);
  }

  .select-shell select {
    width: 100%;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    padding: 10px 14px;
    color: #fff;
    font-size: 0.95rem;
  }

  .library-actions {
    display: flex;
    gap: 8px;
  }

  .library-actions button,
  .history-actions button,
  .action-column button {
    padding: 12px 16px;
    border-radius: 12px;
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
  .history-actions button:hover,
  .action-column button:hover {
    transform: translateY(-2px);
    border-color: rgba(var(--color-accent-rgb), 0.5);
  }

  .library-actions button:disabled,
  .history-actions button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  .history-actions {
    display: flex;
    gap: 12px;
  }

  .timing {
    display: flex;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
  }

  .input-shell {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  .input-shell input {
    width: 72px;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 0.95rem;
    font-weight: 600;
    appearance: textfield;
    outline: none;
  }

  .input-shell input::-webkit-outer-spin-button,
  .input-shell input::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }

  .hint {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.45);
    letter-spacing: 0.08em;
  }

  .loop-card {
    display: grid;
    gap: 4px;
    padding: 16px 18px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(var(--color-note-active-rgb), 0.18), rgba(14, 16, 22, 0.9));
    border: 1px solid rgba(var(--color-note-active-rgb), 0.25);
    min-width: 150px;
  }

  .loop-label {
    text-transform: uppercase;
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.55);
  }

  .loop-value {
    font-size: 1.4rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .loop-sub {
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.55);
    letter-spacing: 0.12em;
  }

  .action-column {
    align-items: stretch;
    gap: 16px;
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
    border-radius: 12px;
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
    .project-column {
      order: 1;
    }

    .timeline-column {
      order: 2;
    }

    .action-column {
      order: 3;
      flex-direction: column;
      gap: 16px;
    }

    .primary-actions,
    .export-actions {
      width: 100%;
    }
  }
</style>
