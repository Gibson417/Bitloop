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
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 14px 24px 18px;
    color: rgba(255, 255, 255, 0.85);
    box-sizing: border-box;
    width: 100%;
  }

  .project-column {
    display: flex;
    flex-direction: column;
    gap: 10px;
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

  .library-actions button:hover {
    transform: translateY(-2px);
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: rgba(0, 0, 0, 0.45);
    box-shadow: 0 4px 12px rgba(var(--color-accent-rgb), 0.25);
  }

  .library-actions button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 720px) {
    .footer {
      grid-template-columns: 1fr;
    }
  }
</style>
