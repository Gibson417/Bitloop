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
      </button>
    {/each}
  </div>
</div>

<style>
  .grid-toolbar {
    display: flex;
    align-items: center;
    gap: 12px; /* Design system: 1.5 × 8px base */
    padding: 8px 12px; /* Consistent padding for proper alignment with other toolbar elements */
    background: var(--color-panel);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.06); /* Reduced from 0.08 for subtler presence */
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

  @media (max-width: 720px) {
    .tool-btn {
      padding: 12px; /* Larger touch targets on mobile */
      min-width: 48px; /* Increased for mobile touch */
      min-height: 48px;
    }
    
    .tool-icon {
      font-size: 1.5rem; /* Slightly larger on mobile */
    }
  }
</style>
