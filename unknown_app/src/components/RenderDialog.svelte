<script>
  import { createEventDispatcher } from 'svelte';

  export let isOpen = false;
  export let renderType = 'wav'; // 'wav' or 'midi'
  export let hasArrangerBlocks = false;

  const dispatch = createEventDispatcher();

  const handleClose = () => {
    isOpen = false;
    dispatch('close');
  };

  const handleRenderPattern = () => {
    dispatch('render', { source: 'pattern' });
    handleClose();
  };

  const handleRenderArranger = () => {
    dispatch('render', { source: 'arranger' });
    handleClose();
  };

  const handleKeydown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleClose();
    }
  };
</script>

{#if isOpen}
  <div class="dialog-overlay" on:click={handleClose} on:keydown={handleKeydown} role="presentation">
    <div class="dialog" on:click|stopPropagation role="dialog" aria-labelledby="dialog-title" aria-modal="true">
      <h2 id="dialog-title">Render to {renderType.toUpperCase()}</h2>
      <p class="dialog-description">What would you like to render?</p>
      
      <div class="dialog-options">
        <button
          type="button"
          class="dialog-option"
          on:click={handleRenderPattern}
        >
          <div class="option-icon">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </div>
          <div class="option-text">
            <div class="option-title">Current Pattern</div>
            <div class="option-desc">Render the current grid pattern</div>
          </div>
        </button>

        {#if hasArrangerBlocks}
          <button
            type="button"
            class="dialog-option"
            on:click={handleRenderArranger}
          >
            <div class="option-icon">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="6" width="20" height="4"/>
                <rect x="6" y="14" width="12" height="4"/>
              </svg>
            </div>
            <div class="option-text">
              <div class="option-title">Whole Song (Arranger)</div>
              <div class="option-desc">Render the complete arrangement timeline</div>
            </div>
          </button>
        {:else}
          <div class="dialog-option disabled" title="No blocks in arranger">
            <div class="option-icon">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="6" width="20" height="4"/>
                <rect x="6" y="14" width="12" height="4"/>
              </svg>
            </div>
            <div class="option-text">
              <div class="option-title">Whole Song (Arranger)</div>
              <div class="option-desc">No blocks in arranger</div>
            </div>
          </div>
        {/if}
      </div>

      <div class="dialog-actions">
        <button type="button" class="cancel-btn" on:click={handleClose}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .dialog {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  }

  h2 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .dialog-description {
    margin: 0 0 20px 0;
    color: var(--color-text-secondary);
    font-size: 14px;
  }

  .dialog-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }

  .dialog-option {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--color-bg-primary);
    border: 2px solid var(--color-border);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
  }

  .dialog-option:not(.disabled):hover {
    border-color: var(--color-accent);
    background: var(--color-bg-tertiary);
  }

  .dialog-option:not(.disabled):focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px rgba(120, 210, 185, 0.2);
  }

  .dialog-option.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .option-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: var(--color-bg-tertiary);
  }

  .option-icon svg {
    width: 24px;
    height: 24px;
    color: var(--color-accent);
  }

  .option-text {
    flex: 1;
  }

  .option-title {
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 4px;
    font-size: 15px;
  }

  .option-desc {
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .cancel-btn {
    padding: 8px 16px;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    color: var(--color-text-primary);
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
  }

  .cancel-btn:hover {
    background: var(--color-bg-secondary);
  }

  .cancel-btn:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(120, 210, 185, 0.2);
  }
</style>
