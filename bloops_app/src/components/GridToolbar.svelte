<script>
  import { createEventDispatcher } from 'svelte';

  export let selectedTool = 'paint'; // 'single', 'paint', 'erase'
  export let trackColor = '#78d2b9';

  const dispatch = createEventDispatcher();

  const tools = [
    { id: 'single', label: 'Single Note', icon: '●', title: 'Place one note at a time' },
    { id: 'paint', label: 'Paint', icon: '🖌', title: 'Drag to paint multiple notes' },
    { id: 'erase', label: 'Erase', icon: '⌫', title: 'Drag to erase notes' }
  ];

  const handleToolSelect = (toolId) => {
    dispatch('toolchange', { tool: toolId });
  };
</script>

<div class="grid-toolbar" data-component="GridToolbar">
  <span class="toolbar-label">Drawing Tools</span>
  <div class="tool-buttons">
    {#each tools as tool}
      <button
        type="button"
        class="tool-btn"
        class:active={selectedTool === tool.id}
        on:click={() => handleToolSelect(tool.id)}
        title={tool.title}
        aria-label={tool.label}
        aria-pressed={selectedTool === tool.id}
        style="border-color: {selectedTool === tool.id ? trackColor : 'rgba(255, 255, 255, 0.15)'}; 
               color: {selectedTool === tool.id ? trackColor : 'rgba(255, 255, 255, 0.7)'};"
      >
        <span class="tool-icon" aria-hidden="true">{tool.icon}</span>
        <span class="tool-label">{tool.label}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .grid-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: var(--color-panel);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .toolbar-label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    opacity: 0.7;
    margin: 0;
    white-space: nowrap;
  }

  .tool-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .tool-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: transparent;
    border: 2px solid;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .tool-btn:hover:not(.active) {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.25) !important;
    transform: translateY(-1px);
  }

  .tool-btn.active {
    background: rgba(var(--color-accent-rgb), 0.15);
    box-shadow: 0 0 12px rgba(var(--color-accent-rgb), 0.3);
  }

  .tool-btn:active {
    transform: scale(0.97);
  }

  .tool-icon {
    font-size: 1.1rem;
    line-height: 1;
  }

  .tool-label {
    font-size: 0.75rem;
    letter-spacing: 0.03em;
  }

  @media (max-width: 720px) {
    .tool-label {
      display: none;
    }
    
    .tool-btn {
      padding: 8px;
      min-width: 40px;
      justify-content: center;
    }
  }
</style>
