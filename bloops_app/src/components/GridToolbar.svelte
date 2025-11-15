<script>
  import { createEventDispatcher } from 'svelte';

  export let selectedTool = 'paint'; // 'single', 'paint', 'erase'
  export let trackColor = '#78d2b9';
  export let canUndo = false;
  export let canRedo = false;

  const dispatch = createEventDispatcher();

  const tools = [
    { id: 'single', label: 'Single Note', icon: '●', title: 'Place one note at a time' },
    { id: 'paint', label: 'Paint', icon: '🖌', title: 'Drag to paint multiple notes' },
    { id: 'erase', label: 'Erase', icon: '⌫', title: 'Drag to erase notes' }
  ];

  const handleToolSelect = (toolId) => {
    dispatch('toolchange', { tool: toolId });
  };

  const handleUndo = () => {
    dispatch('undo');
  };

  const handleRedo = () => {
    dispatch('redo');
  };
</script>

<div class="grid-toolbar" data-component="GridToolbar">
  <span class="toolbar-label">Tools</span>
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
      </button>
    {/each}
  </div>
  <div class="history-buttons">
    <button
      type="button"
      class="history-btn"
      on:click={handleUndo}
      disabled={!canUndo}
      title="Undo"
      aria-label="Undo"
    >
      ↶
    </button>
    <button
      type="button"
      class="history-btn"
      on:click={handleRedo}
      disabled={!canRedo}
      title="Redo"
      aria-label="Redo"
    >
      ↷
    </button>
  </div>
</div>

<style>
  .grid-toolbar {
    display: flex;
    align-items: center;
    gap: 12px; /* Design system: 1.5 × 8px base */
    /* Background removed for cleaner toolbar integration */
  }

  .toolbar-label {
    font-size: 0.7rem; /* Reduced from 0.75rem to be less prominent */
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    opacity: 0.6; /* Reduced from 0.7 for subtler label */
    margin: 0;
    white-space: nowrap;
  }

  .tool-buttons {
    display: flex;
    gap: 6px; /* Reduced from 8px for tighter grouping */
    flex-wrap: wrap;
  }

  .tool-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px; /* Icon-only: square padding for better visual balance */
    min-width: 44px; /* WCAG: minimum touch target size */
    min-height: 44px;
    background: transparent;
    border: 2px solid;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .tool-btn:hover:not(.active) {
    background: rgba(255, 255, 255, 0.04); /* Reduced from 0.05 for subtler hover */
    border-color: rgba(255, 255, 255, 0.25) !important;
    transform: translateY(-1px);
  }

  .tool-btn.active {
    background: rgba(var(--color-accent-rgb), 0.12); /* Reduced from 0.15 */
    box-shadow: 0 0 8px rgba(var(--color-accent-rgb), 0.25); /* Reduced glow for subtler active state */
  }

  .tool-btn:active {
    transform: scale(0.97);
  }

  .tool-icon {
    font-size: 1.4rem; /* Increased from 1.1rem for prominence as icon-only */
    line-height: 1;
  }

  .history-buttons {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-left: 8px;
  }

  .history-btn {
    min-width: 36px;
    min-height: 36px;
    border-radius: 8px;
    border: 1px solid rgba(var(--color-accent-rgb), 0.4);
    background: rgba(var(--color-accent-rgb), 0.16);
    color: rgba(var(--color-accent-rgb), 0.9);
    font-size: 1.4rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .history-btn:hover:not(:disabled) {
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: rgba(var(--color-accent-rgb), 0.26);
    color: #fff;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(var(--color-accent-rgb), 0.2);
  }

  .history-btn:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .history-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    color: rgba(255, 255, 255, 0.4);
    border-color: rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.05);
  }

  @media (max-width: 720px) {
    .tool-btn {
      padding: 12px; /* Larger touch targets on mobile */
      min-width: 48px; /* Increased for mobile touch */
      min-height: 48px;
    }
    
    .tool-icon {
      font-size: 1.5rem; /* Slightly larger on mobile */
    }

    .history-btn {
      min-width: 40px;
      min-height: 40px;
    }
  }
</style>
