<script>
  import { createEventDispatcher } from 'svelte';

  export let patterns = [];
  export let selectedPattern = 0;

  const dispatch = createEventDispatcher();

  const handleSelect = (index) => {
    dispatch('select', { index });
  };

  const handleAdd = () => {
    dispatch('add');
  };

  const handleDuplicate = (index) => {
    dispatch('duplicate', { index });
  };

  const handleRemove = (index) => {
    dispatch('remove', { index });
  };

  const handleRename = (index, event) => {
    const newName = event.target.value;
    if (newName && newName.trim()) {
      dispatch('rename', { index, name: newName });
    }
  };

  const handleKeyNavigation = (event, index) => {
    // Handle Enter key for selection
    if (event.key === 'Enter') {
      handleSelect(index);
      return;
    }

    // Handle arrow key navigation
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      const nextIndex = Math.min(index + 1, patterns.length - 1);
      if (nextIndex !== index) {
        handleSelect(nextIndex);
        // Focus the next pattern item
        setTimeout(() => {
          const items = document.querySelectorAll('.pattern-item');
          items[nextIndex]?.focus();
        }, 0);
      }
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const prevIndex = Math.max(index - 1, 0);
      if (prevIndex !== index) {
        handleSelect(prevIndex);
        // Focus the previous pattern item
        setTimeout(() => {
          const items = document.querySelectorAll('.pattern-item');
          items[prevIndex]?.focus();
        }, 0);
      }
    } else if (event.key === 'Home') {
      event.preventDefault();
      handleSelect(0);
      // Focus the first pattern item
      setTimeout(() => {
        const items = document.querySelectorAll('.pattern-item');
        items[0]?.focus();
      }, 0);
    } else if (event.key === 'End') {
      event.preventDefault();
      const lastIndex = patterns.length - 1;
      handleSelect(lastIndex);
      // Focus the last pattern item
      setTimeout(() => {
        const items = document.querySelectorAll('.pattern-item');
        items[lastIndex]?.focus();
      }, 0);
    }
  };

  $: canRemove = patterns.length > 1;
</script>

<div class="pattern-selector">
  <div class="pattern-header">
    <h3 class="pattern-title">Patterns</h3>
    <button
      type="button"
      class="add-pattern-btn"
      on:click={handleAdd}
      title="Add new pattern"
      aria-label="Add new pattern"
    >
      +
    </button>
  </div>
  
  <div class="pattern-list">
    {#each patterns as pattern, index (pattern.id)}
      <div 
        class="pattern-item" 
        class:selected={index === selectedPattern}
        role="button"
        tabindex="0"
        on:click={() => handleSelect(index)}
        on:keydown={(e) => handleKeyNavigation(e, index)}
        aria-label="Pattern {index + 1}: {pattern.name}"
      >
        <input
          type="text"
          class="pattern-name"
          value={pattern.name}
          on:change={(e) => handleRename(index, e)}
          on:click={(e) => e.stopPropagation()}
          placeholder="Pattern name"
          aria-label="Pattern name"
        />
        <div class="pattern-actions">
          <button
            type="button"
            class="pattern-action-btn"
            on:click|stopPropagation={() => handleDuplicate(index)}
            title="Duplicate pattern"
            aria-label="Duplicate pattern"
          >
            ⎘
          </button>
          {#if canRemove}
            <button
              type="button"
              class="pattern-action-btn remove"
              on:click|stopPropagation={() => handleRemove(index)}
              title="Remove pattern"
              aria-label="Remove pattern"
            >
              ×
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .pattern-selector {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: var(--color-panel);
    border-radius: 12px;
    border: 1px solid rgba(var(--color-accent-rgb), 0.2);
  }

  .pattern-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .pattern-title {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .add-pattern-btn {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    border: 1px solid rgba(var(--color-accent-rgb), 0.4);
    background: rgba(var(--color-accent-rgb), 0.16);
    color: rgba(var(--color-accent-rgb), 0.9);
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .add-pattern-btn:hover {
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: rgba(var(--color-accent-rgb), 0.26);
    transform: scale(1.05);
  }

  .add-pattern-btn:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .pattern-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pattern-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.08);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .pattern-item:hover {
    background: rgba(0, 0, 0, 0.3);
    border-color: rgba(var(--color-accent-rgb), 0.3);
  }

  .pattern-item.selected {
    background: rgba(var(--color-accent-rgb), 0.18);
    border-color: rgba(var(--color-accent-rgb), 0.5);
  }

  .pattern-item:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .pattern-name {
    flex: 1;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    padding: 4px 8px;
    color: var(--color-text);
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .pattern-name:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .pattern-name:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(var(--color-accent-rgb), 0.4);
  }

  .pattern-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  .pattern-action-btn {
    width: 44px;
    height: 44px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(0, 0, 0, 0.3);
    color: var(--color-text-muted);
    font-size: 1.2rem;
    line-height: 1;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .pattern-action-btn:hover {
    border-color: rgba(var(--color-accent-rgb), 0.5);
    background: rgba(var(--color-accent-rgb), 0.2);
    color: var(--color-text);
    transform: scale(1.05);
  }

  .pattern-action-btn.remove:hover {
    border-color: rgba(255, 100, 100, 0.5);
    background: rgba(255, 100, 100, 0.2);
    color: var(--color-text);
  }

  .pattern-action-btn:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  @media (max-width: 720px) {
    .pattern-selector {
      padding: 12px;
    }

    .pattern-action-btn {
      width: 44px;
      height: 44px;
      font-size: 1.3rem;
    }

    .add-pattern-btn {
      width: 44px;
      height: 44px;
    }
  }
</style>
