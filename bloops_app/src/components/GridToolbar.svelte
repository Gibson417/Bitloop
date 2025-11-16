<script>
  import { createEventDispatcher } from 'svelte';

  export let trackColor = '#78d2b9';
  export let canUndo = false;
  export let canRedo = false;

  const dispatch = createEventDispatcher();

  const handleUndo = () => {
    dispatch('undo');
  };

  const handleRedo = () => {
    dispatch('redo');
  };
</script>

<div class="grid-toolbar" data-component="GridToolbar">
  <span class="toolbar-label">Draw</span>
  <div class="tool-buttons">
    <button
      type="button"
      class="tool-btn active"
      title="Draw - Click to toggle notes, drag to paint/erase"
      aria-label="Draw tool"
      aria-pressed="true"
    >
      <span class="tool-icon" aria-hidden="true">✏️</span>
    </button>
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
    padding: 0;
    min-width: 36px;
    min-height: 36px;
    background: transparent;
    border: 2px solid rgba(var(--color-accent-rgb), 0.4);
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    color: rgba(var(--color-accent-rgb), 0.8);
  }

  .tool-btn:hover:not(.active) {
    background: rgba(255, 255, 255, 0.04); /* Reduced from 0.05 for subtler hover */
    border-color: rgba(var(--color-accent-rgb), 0.5);
    transform: translateY(-1px);
  }

  .tool-btn.active {
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: rgba(var(--color-accent-rgb), 0.12); /* Reduced from 0.15 */
    color: rgba(var(--color-accent-rgb), 1);
    box-shadow: 0 0 8px rgba(var(--color-accent-rgb), 0.25); /* Reduced glow for subtler active state */
  }

  .tool-btn:active {
    transform: scale(0.97);
  }

  .tool-icon {
    font-size: 1.2rem;
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
    font-size: 1.2rem;
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
      padding: 0;
      min-width: 44px;
      min-height: 44px;
    }
    
    .tool-icon {
      font-size: 1.3rem;
    }

    .history-btn {
      min-width: 44px;
      min-height: 44px;
      font-size: 1.3rem;
    }
  }
</style>
