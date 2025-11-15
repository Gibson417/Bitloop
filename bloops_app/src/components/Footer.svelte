<script>
  import { createEventDispatcher } from 'svelte';

  export let patterns = [];
  export let selectedPattern = 0;

  const dispatch = createEventDispatcher();

  // Pattern handlers
  const handlePatternSelect = (index) => {
    dispatch('patternselect', { index });
  };

  const handlePatternAdd = () => {
    dispatch('patternadd');
  };

  const handlePatternDuplicate = (index) => {
    dispatch('patternduplicate', { index });
  };

  const handlePatternRemove = (index) => {
    dispatch('patternremove', { index });
  };

  const handlePatternRename = (index, event) => {
    const newName = event.target.value;
    if (newName && newName.trim()) {
      dispatch('patternrename', { index, name: newName });
    }
  };

  // Generate a color for each pattern based on index
  const getPatternColor = (index) => {
    const colors = [
      '#78d2b9', // accent (default)
      '#ff6b9d', // pink
      '#ffd93d', // yellow
      '#6bcf7f', // green
      '#a78bfa', // purple
      '#60a5fa', // blue
      '#fb923c', // orange
      '#ec4899', // magenta
    ];
    return colors[index % colors.length];
  };

  const handleKeyNavigation = (event, index) => {
    // Handle Enter key for selection
    if (event.key === 'Enter') {
      handlePatternSelect(index);
      return;
    }

    // Handle arrow key navigation
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      const nextIndex = Math.min(index + 1, patterns.length - 1);
      if (nextIndex !== index) {
        handlePatternSelect(nextIndex);
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
        handlePatternSelect(prevIndex);
        // Focus the previous pattern item
        setTimeout(() => {
          const items = document.querySelectorAll('.pattern-item');
          items[prevIndex]?.focus();
        }, 0);
      }
    } else if (event.key === 'Home') {
      event.preventDefault();
      handlePatternSelect(0);
      // Focus the first pattern item
      setTimeout(() => {
        const items = document.querySelectorAll('.pattern-item');
        items[0]?.focus();
      }, 0);
    } else if (event.key === 'End') {
      event.preventDefault();
      const lastIndex = patterns.length - 1;
      handlePatternSelect(lastIndex);
      // Focus the last pattern item
      setTimeout(() => {
        const items = document.querySelectorAll('.pattern-item');
        items[lastIndex]?.focus();
      }, 0);
    }
  };

  $: canRemovePattern = patterns.length > 1;
</script>

<footer class="footer" data-component="Footer">
  <div class="pattern-column">
    <div class="field pattern-field">
      <label for="pattern-list" class="pattern-label">
        <svg class="pattern-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span>Patterns</span>
      </label>
      <div class="pattern-list" id="pattern-list">
        {#each patterns as pattern, index (pattern.id)}
          <div 
            class="pattern-item" 
            class:selected={index === selectedPattern}
            role="button"
            tabindex="0"
            on:click={() => handlePatternSelect(index)}
            on:keydown={(e) => handleKeyNavigation(e, index)}
            aria-label="Pattern {index + 1}: {pattern.name}"
          >
            <span class="pattern-strip" style={`background:${getPatternColor(index)}`}></span>
            <span class="pattern-id" style={`color:${getPatternColor(index)}`}>P{index + 1}</span>
            <input
              type="text"
              class="pattern-name"
              value={pattern.name}
              on:change={(e) => handlePatternRename(index, e)}
              on:click={(e) => e.stopPropagation()}
              placeholder="Pattern name"
              aria-label="Pattern name"
            />
            <div class="pattern-actions">
              <button
                type="button"
                class="pattern-action-btn"
                on:click|stopPropagation={() => handlePatternDuplicate(index)}
                title="Duplicate pattern"
                aria-label="Duplicate pattern"
              >
                <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              {#if canRemovePattern}
                <button
                  type="button"
                  class="pattern-action-btn remove"
                  on:click|stopPropagation={() => handlePatternRemove(index)}
                  title="Remove pattern"
                  aria-label="Remove pattern"
                >
                  <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
      <button
        type="button"
        class="add-pattern-btn"
        on:click={handlePatternAdd}
        title="Add new pattern"
        aria-label="Add new pattern"
      >
        <svg class="btn-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        New Pattern
      </button>
    </div>
  </div>
</footer>

<style>
  .footer {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 24px;
    padding: 16px 24px;
    color: rgba(255, 255, 255, 0.85);
    box-sizing: border-box;
    width: 100%;
  }

  .pattern-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 0 1 auto;
    max-width: 800px;
    width: 100%;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .pattern-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(var(--color-accent-rgb), 0.8);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .pattern-label:hover {
    color: rgba(var(--color-accent-rgb), 1);
  }

  .pattern-icon {
    width: 16px;
    height: 16px;
    color: rgba(var(--color-accent-rgb), 0.75);
    transition: color 0.2s ease;
  }

  .pattern-label:hover .pattern-icon {
    color: rgba(var(--color-accent-rgb), 1);
  }

  .pattern-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }

  .pattern-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: 8px;
    background: rgba(var(--color-background, 17, 20, 29), 0.5);
    border: 1.5px solid rgba(255, 255, 255, 0.08);
    cursor: pointer;
    transition: all 0.2s ease;
    flex: 0 1 auto;
    min-width: 200px;
    position: relative;
    min-height: 48px;
  }

  .pattern-item:hover {
    border-color: rgba(var(--color-accent-rgb), 0.4);
    background: rgba(var(--color-background, 17, 20, 29), 0.85);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(var(--color-accent-rgb), 0.2);
  }

  .pattern-item.selected {
    background: rgba(var(--color-accent-rgb), 0.12);
    border-color: rgba(var(--color-accent-rgb), 0.7);
    box-shadow: 0 4px 16px rgba(var(--color-accent-rgb), 0.25);
  }

  .pattern-item:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .pattern-strip {
    width: 6px;
    height: 100%;
    min-height: 24px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .pattern-id {
    font-weight: 700;
    font-size: 0.85rem;
    letter-spacing: 0.05em;
    opacity: 0.9;
    flex-shrink: 0;
    min-width: 24px;
  }

  .pattern-name {
    flex: 1;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    padding: 4px 8px;
    color: var(--color-text, #fff);
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.2s ease;
    min-width: 0;
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
    min-width: 36px;
    min-height: 36px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.85);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    flex-shrink: 0;
  }

  .pattern-action-btn .action-icon {
    width: 16px;
    height: 16px;
    display: block;
  }

  .pattern-action-btn:hover {
    border-color: rgba(var(--color-accent-rgb), 0.5);
    background: rgba(var(--color-accent-rgb), 0.2);
    color: #fff;
    transform: scale(1.05);
  }

  .pattern-action-btn.remove:hover {
    border-color: rgba(255, 100, 100, 0.5);
    background: rgba(255, 100, 100, 0.2);
    color: #fff;
  }

  .pattern-action-btn:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .add-pattern-btn {
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
    justify-content: center;
    width: fit-content;
  }

  .add-pattern-btn:hover {
    transform: translateY(-2px);
    border-color: rgba(var(--color-accent-rgb), 0.55);
    background: linear-gradient(145deg, rgba(var(--color-accent-rgb), 0.15), rgba(0, 0, 0, 0.45));
    box-shadow: 0 6px 16px rgba(var(--color-accent-rgb), 0.3);
  }

  .add-pattern-btn:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .add-pattern-btn:active {
    transform: translateY(0);
  }

  @media (max-width: 960px) {
    .footer {
      flex-direction: column;
      gap: 20px;
    }

    .pattern-column {
      max-width: 100%;
      width: 100%;
    }
  }

  @media (max-width: 640px) {
    .footer {
      padding: 18px 18px 24px;
    }

    .pattern-list {
      flex-direction: column;
    }

    .pattern-item {
      min-width: 100%;
    }

    /* Ensure touch-friendly targets on mobile */
    .pattern-action-btn {
      min-width: 40px;
      min-height: 40px;
    }
  }
</style>
