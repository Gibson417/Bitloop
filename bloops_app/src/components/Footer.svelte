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
    max-width: 420px;
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
    color: rgba(255, 255, 255, 0.78);
  }

  .select-shell {
    position: relative;
  }

  .select-shell::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
    pointer-events: none;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(120, 210, 255, 0.12));
    opacity: 0.7;
  }

  .select-shell select {
    position: relative;
    z-index: 1;
    width: 100%;
    background: linear-gradient(145deg, rgba(0, 0, 0, 0.5), rgba(10, 12, 18, 0.45));
    border: 1px solid rgba(var(--color-accent-rgb), 0.3);
    border-radius: 12px;
    padding: 12px 16px;
    color: rgba(255, 255, 255, 0.95);
    font-size: 0.95rem;
    font-weight: 600;
    appearance: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .select-shell select:hover {
    background: linear-gradient(145deg, rgba(0, 0, 0, 0.65), rgba(10, 12, 18, 0.6));
    border-color: rgba(var(--color-accent-rgb), 0.5);
  }

  .select-shell select:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.7);
    outline-offset: 2px;
    border-color: rgba(var(--color-accent-rgb), 0.5);
    background: linear-gradient(145deg, rgba(0, 0, 0, 0.7), rgba(10, 12, 18, 0.65));
  }

  .select-shell select option {
    background: rgba(10, 12, 18, 0.98);
    color: rgba(255, 255, 255, 0.95);
    padding: 8px;
  }

  .select-shell select option:disabled {
    color: rgba(255, 255, 255, 0.78);
    background: rgba(120, 210, 255, 0.14);
    font-weight: 600;
  }

  .library-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .library-actions button {
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

  .library-actions button:hover:not(:disabled) {
    transform: translateY(-2px);
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: rgba(0, 0, 0, 0.45);
    box-shadow: 0 4px 12px rgba(var(--color-accent-rgb), 0.25);
  }

  .library-actions button:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .library-actions button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    border-color: rgba(255, 255, 255, 0.12);
  }

  @media (max-width: 640px) {
    .footer {
      padding: 18px 18px 24px;
    }

    .library-actions {
      width: 100%;
    }

    .library-actions button {
      flex: 1 1 120px;
      text-align: center;
    }
  }
</style>
