<script>
  import { createEventDispatcher } from 'svelte';

  // Props
  export let options = []; // Can be array of strings or array of objects with {value, label}
  export let value = null; // Current selected value
  export let label = ''; // Label for the control

  const dispatch = createEventDispatcher();

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
    if (options.length === 0) return;
    
    const newIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1;
    const newValue = isObjectArray ? options[newIndex].value : options[newIndex];
    
    dispatch('change', { value: newValue });
  };

  // Handle right arrow click (next option)
  const handleNext = () => {
    if (options.length === 0) return;
    
    const newIndex = currentIndex >= options.length - 1 ? 0 : currentIndex + 1;
    const newValue = isObjectArray ? options[newIndex].value : options[newIndex];
    
    dispatch('change', { value: newValue });
  };
</script>

<div class="arrow-selector">
  {#if label}
    <div class="selector-label">{label}</div>
  {/if}
  <div class="selector-controls">
    <button
      type="button"
      class="arrow-button"
      on:click={handlePrevious}
      aria-label="Select previous {label}"
      title="Previous"
    >
      ◀
    </button>
    <div class="selector-value">{displayValue}</div>
    <button
      type="button"
      class="arrow-button"
      on:click={handleNext}
      aria-label="Select next {label}"
      title="Next"
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
    color: #fff;
    font-size: 0.78rem;
  }

  .selector-label {
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.75);
  }

  .selector-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(18, 22, 32, 0.9);
    border-radius: 12px;
    border: 1px solid rgba(var(--color-accent-rgb), 0.22);
    padding: 6px;
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
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;
  }

  .arrow-button:hover {
    border-color: rgba(var(--color-accent-rgb), 0.5);
    background: rgba(var(--color-accent-rgb), 0.2);
    color: #fff;
    transform: scale(1.05);
  }

  .arrow-button:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .arrow-button:active {
    transform: scale(0.95);
  }

  .selector-value {
    flex: 1;
    text-align: center;
    font-size: 0.95rem;
    font-weight: 600;
    color: #fff;
    padding: 4px 8px;
    min-width: 80px;
  }

  @media (max-width: 720px) {
    .selector-value {
      min-width: 60px;
      font-size: 0.85rem;
    }

    .arrow-button {
      width: 28px;
      height: 28px;
      font-size: 0.8rem;
    }
  }
</style>
