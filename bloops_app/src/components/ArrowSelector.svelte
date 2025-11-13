<script>
  import { createEventDispatcher } from 'svelte';

  // Props
  export let options = []; // Can be array of strings or array of objects with {value, label}
  export let value = null; // Current selected value
  export let label = ''; // Label for the control
  export let disabled = false; // Disabled state

  const dispatch = createEventDispatcher();

  // Generate unique ID for accessibility
  const uniqueId = `selector-${Math.random().toString(36).substr(2, 9)}`;

  // Determine if options are objects or strings
  $: isObjectArray = options.length > 0 && typeof options[0] === 'object' && options[0] !== null && 'value' in options[0];

  // Get the current index
  $: currentIndex = isObjectArray
    ? options.findIndex(opt => opt.value === value)
    : options.findIndex(opt => opt === value);

  // Get the display value
  $: displayValue = isObjectArray
    ? (options[currentIndex]?.label ?? '')
    : (options[currentIndex] ?? '');

  // Handle left arrow click (previous option)
  const handlePrevious = () => {
    if (options.length === 0 || disabled) return;
    
    const newIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1;
    const newValue = isObjectArray ? options[newIndex].value : options[newIndex];
    
    dispatch('change', { value: newValue });
  };

  // Handle right arrow click (next option)
  const handleNext = () => {
    if (options.length === 0 || disabled) return;
    
    const newIndex = currentIndex >= options.length - 1 ? 0 : currentIndex + 1;
    const newValue = isObjectArray ? options[newIndex].value : options[newIndex];
    
    dispatch('change', { value: newValue });
  };

  // Handle keyboard navigation with arrow keys
  const handleKeyDown = (e) => {
    if (disabled) return;
    
    if (e.key === 'ArrowLeft' || e.key === 'Left') {
      e.preventDefault();
      handlePrevious();
    } else if (e.key === 'ArrowRight' || e.key === 'Right') {
      e.preventDefault();
      handleNext();
    } else if (e.key === ' ') {
      // Prevent default spacebar button activation and let it bubble to global handler
      e.preventDefault();
    }
  };
</script>

<div class="arrow-selector" class:disabled role="group" aria-labelledby={label ? `label-${uniqueId}` : undefined}>
  {#if label}
    <div id="label-{uniqueId}" class="selector-label">{label}</div>
  {/if}
  <div class="selector-controls" role="group">
    <button
      type="button"
      class="arrow-button"
      on:click={handlePrevious}
      on:keydown={handleKeyDown}
      aria-label="Select previous {label}"
      title="Previous"
      disabled={disabled}
      tabindex="0"
    >
      ◀
    </button>
    <div 
      class="selector-value"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {displayValue}
    </div>
    <button
      type="button"
      class="arrow-button"
      on:click={handleNext}
      on:keydown={handleKeyDown}
      aria-label="Select next {label}"
      title="Next"
      disabled={disabled}
      tabindex="0"
    >
      ▶
    </button>
  </div>
</div>

<style>
  .arrow-selector {
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: var(--color-text);
    font-size: 0.78rem;
  }

  .selector-label {
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .selector-controls {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--color-panel);
    border-radius: 6px;
    border: 1px solid rgba(var(--color-accent-rgb), 0.22);
    padding: 4px 6px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .selector-controls:focus-within {
    border-color: rgba(var(--color-accent-rgb), 0.55);
    box-shadow: 0 0 0 1px rgba(var(--color-accent-rgb), 0.2), 0 6px 18px rgba(0, 0, 0, 0.32);
  }

  .arrow-button {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    min-height: 28px;
    border-radius: 6px;
    border: 1px solid rgba(var(--color-text), 0.2);
    background: var(--color-panel);
    color: var(--color-text-muted);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;
    flex-shrink: 0;
  }

  .arrow-button:hover {
    border-color: rgba(var(--color-accent-rgb), 0.5);
    background: rgba(var(--color-accent-rgb), 0.2);
    color: var(--color-text);
    transform: scale(1.05);
  }

  .arrow-button:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .arrow-button:active {
    transform: scale(0.95);
  }

  .arrow-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }

  .arrow-selector.disabled {
    opacity: 0.6;
  }

  .selector-value {
    flex: 1;
    text-align: center;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text);
    padding: 4px 8px;
    min-width: 50px;
  }

  @media (max-width: 720px) {
    .selector-value {
      min-width: 50px;
      font-size: 0.8rem;
    }

    .arrow-button {
      min-width: 40px;
      min-height: 40px;
      font-size: 0.8rem;
    }

    .selector-controls {
      padding: 4px 6px;
      gap: 6px;
    }
  }
  
  /* Touch device improvements */
  @media (hover: none) and (pointer: coarse) {
    .arrow-button {
      min-width: 44px;
      min-height: 44px;
    }
  }
</style>
