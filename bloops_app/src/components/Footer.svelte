<script>
  import { createEventDispatcher } from 'svelte';

  export let projects = [];
  export let currentId = null;

  const dispatch = createEventDispatcher();

  let selectedProjectId = currentId ?? '';

  const handleSelectProject = (event) => dispatch('selectproject', { id: event.target.value });
  const handleNewProject = () => dispatch('newproject');
  const handleDuplicateProject = () => dispatch('duplicateproject');
  const handleDeleteProject = () => dispatch('deleteproject');

  $: selectedProjectId = currentId ?? '';
</script>

<footer class="footer">
  <div class="project-column">
    <div class="field session-field">
      <label for="project-select" class="session-label">
        <svg class="sessions-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Sessions</span>
      </label>
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
        <svg class="select-chevron" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="library-actions">
        <button type="button" class="action-btn new-btn" on:click={handleNewProject}>
          <svg class="btn-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New
        </button>
        <button type="button" class="action-btn duplicate-btn" on:click={handleDuplicateProject} disabled={!selectedProjectId}>
          <svg class="btn-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Duplicate
        </button>
        <button type="button" class="action-btn delete-btn" on:click={handleDeleteProject} disabled={projects.length <= 1}>
          <svg class="btn-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Delete
        </button>
      </div>
    </div>
  </div>
</footer>

<style>
  .footer {
    display: flex;
    justify-content: flex-start;
    padding: 14px 24px 18px;
    color: rgba(255, 255, 255, 0.85);
    box-sizing: border-box;
    width: 100%;
  }

  .project-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 480px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .session-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(var(--color-accent-rgb), 0.8);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .session-label:hover {
    color: rgba(var(--color-accent-rgb), 1);
  }

  .sessions-icon {
    width: 16px;
    height: 16px;
    color: rgba(var(--color-accent-rgb), 0.75);
    transition: color 0.2s ease;
  }

  .session-label:hover .sessions-icon {
    color: rgba(var(--color-accent-rgb), 1);
  }

  .select-shell {
    position: relative;
  }

  .select-shell select {
    width: 100%;
    background: linear-gradient(145deg, rgba(var(--color-accent-rgb), 0.08), rgba(0, 0, 0, 0.35));
    border: 1.5px solid rgba(var(--color-accent-rgb), 0.25);
    border-radius: 10px;
    padding: 12px 40px 12px 16px;
    color: #fff;
    font-size: 0.95rem;
    font-weight: 600;
    appearance: none;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .select-shell select:hover {
    background: linear-gradient(145deg, rgba(var(--color-accent-rgb), 0.12), rgba(0, 0, 0, 0.4));
    border-color: rgba(var(--color-accent-rgb), 0.4);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(var(--color-accent-rgb), 0.2);
  }

  .select-shell select:focus-visible {
    outline: none;
    border-color: rgba(var(--color-accent-rgb), 0.6);
    box-shadow: 0 0 0 3px rgba(var(--color-accent-rgb), 0.15), 0 4px 16px rgba(var(--color-accent-rgb), 0.25);
    transform: translateY(-1px);
  }

  .select-shell select option {
    background: rgba(26, 29, 40, 0.98);
    color: #fff;
    padding: 8px;
  }

  .select-chevron {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    color: rgba(var(--color-accent-rgb), 0.6);
    pointer-events: none;
    transition: color 0.2s ease;
  }

  .select-shell:hover .select-chevron {
    color: rgba(var(--color-accent-rgb), 0.85);
  }

  .library-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1.5px solid rgba(var(--color-accent-rgb), 0.3);
    background: linear-gradient(145deg, rgba(var(--color-accent-rgb), 0.08), rgba(0, 0, 0, 0.35));
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }

  .btn-icon {
    width: 16px;
    height: 16px;
    color: rgba(var(--color-accent-rgb), 0.85);
    transition: color 0.2s ease;
  }

  .action-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    border-color: rgba(var(--color-accent-rgb), 0.55);
    background: linear-gradient(145deg, rgba(var(--color-accent-rgb), 0.15), rgba(0, 0, 0, 0.45));
    box-shadow: 0 6px 16px rgba(var(--color-accent-rgb), 0.3);
  }

  .action-btn:hover:not(:disabled) .btn-icon {
    color: rgba(var(--color-accent-rgb), 1);
  }

  .action-btn:focus-visible {
    outline: none;
    border-color: rgba(var(--color-accent-rgb), 0.6);
    box-shadow: 0 0 0 3px rgba(var(--color-accent-rgb), 0.15), 0 4px 12px rgba(var(--color-accent-rgb), 0.25);
  }

  .action-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(0, 0, 0, 0.25);
  }

  .action-btn:disabled .btn-icon {
    color: rgba(255, 255, 255, 0.3);
  }

  @media (max-width: 640px) {
    .footer {
      padding: 18px 18px 24px;
    }

    .project-column {
      max-width: 100%;
    }

    .library-actions {
      width: 100%;
    }

    .action-btn {
      flex: 1 1 calc(33.333% - 8px);
      min-width: 100px;
    }
  }

  @media (max-width: 420px) {
    .action-btn {
      flex: 1 1 100%;
      min-width: 100%;
    }
  }
</style>
