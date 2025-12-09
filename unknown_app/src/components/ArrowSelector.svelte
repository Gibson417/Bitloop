<script>
  import { createEventDispatcher } from 'svelte';

  // Props
  export let options = []; // Can be array of strings or array of objects with {value, label}
  export let value = null; // Current selected value
  export let label = ''; // Label for the control
  export let disabled = false; // Disabled state
  export let trackColor = '#78d2b9'; // Track color for styling
  export let compact = false; // Compact mode with smaller buttons (26px)
  export let fixedWidth = false; // Fixed width mode for consistent layout
  export let useThemeColor = false; // Use theme accent color instead of trackColor

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

  // Determine color to use
  $: colorToUse = useThemeColor ? 'rgba(var(--color-accent-rgb), 1)' : trackColor;
</script>

<div class="arrow-selector" class:disabled class:compact class:fixed-width={fixedWidth} role="group" aria-labelledby={label ? `label-${uniqueId}` : undefined} data-component="ArrowSelector">
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
      style="border-color: {colorToUse}33; color: {colorToUse};"
      data-component="ArrowButton:Previous"
    >
      ◀
    </button>
    <div 
      class="selector-value"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style="color: {colorToUse};"
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
      style="border-color: {colorToUse}33; color: {colorToUse};"
      data-component="ArrowButton:Next"
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

  .arrow-selector.fixed-width {
    min-width: 140px;
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
    justify-content: space-between;
    gap: 6px;
    border-radius: 6px;
    padding: 0;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    height: 40px;
    box-sizing: border-box;
  }

  .compact .selector-controls {
    height: 26px;
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

  .compact .arrow-button {
    width: 26px;
    height: 26px;
    font-size: 0.9rem;
  }

  .arrow-button:hover:not(:disabled) {
    background: rgba(var(--color-accent-rgb), 0.1);
    transform: scale(1.05);
    will-change: transform;
  }

  .arrow-button:focus {
    outline: none;
  }

  .arrow-button:focus-visible {
    outline: none;
  }

  .arrow-button:active:not(:disabled) {
    transform: scale(0.95);
    will-change: transform;
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
    flex: 1;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .compact .selector-value {
    font-size: 0.8rem;
    min-width: 30px;
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
