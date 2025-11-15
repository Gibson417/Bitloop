<script>
  import { createEventDispatcher } from 'svelte';

  // Props
  export let options = []; // Can be array of strings or array of objects with {value, label}
  export let value = null; // Current selected value
  export let label = ''; // Label for the control
  export let disabled = false; // Disabled state
  export let trackColor = '#78d2b9'; // Track color for styling

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
      style="border-color: {trackColor}33; color: {trackColor};"
    >
      ◀
    </button>
    <div 
      class="selector-value"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style="color: {trackColor};"
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
      style="border-color: {trackColor}33; color: {trackColor};"
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
    letter-spacing: 0.08em;
    font-weight: 600;
    font-size: 0.7rem;
    color: var(--color-text-muted);
    opacity: 0.85;
  }

  .selector-controls {
    display: flex;
    align-items: center;
    gap: 6px;
    border-radius: 6px;
    padding: 0;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    height: 40px;
    box-sizing: border-box;
  }

  .selector-controls:focus-within {
    box-shadow: 0 0 0 1px rgba(var(--color-accent-rgb), 0.2), 0 6px 18px rgba(0, 0, 0, 0.32);
  }

  .arrow-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: 1px solid;
    background: transparent;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.15s ease;
    padding: 0;
    flex-shrink: 0;
    line-height: 1;
  }

  .arrow-button:hover:not(:disabled) {
    background: rgba(var(--color-accent-rgb), 0.1);
    transform: scale(1.05);
  }

  .arrow-button:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.5);
    outline-offset: 2px;
  }

  .arrow-button:active:not(:disabled) {
    transform: scale(0.95);
  }

  .arrow-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    pointer-events: none;
  }

  .arrow-selector.disabled {
    opacity: 0.6;
  }

  .selector-value {
    font-size: 0.8rem;
    font-weight: 600;
    min-width: 30px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 720px) {
    .selector-value {
      min-width: 50px;
      font-size: 0.8rem;
    }

    .arrow-button {
      min-width: 44px;
      min-height: 44px;
      font-size: 1rem;
    }

    .selector-controls {
      padding: 0;
      gap: 6px;
    }
  }
</style>
