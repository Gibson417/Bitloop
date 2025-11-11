<script>
  import { createEventDispatcher } from 'svelte';

  export let id = '';
  export let label = '';
  export let options = [];
  export let value = '';
  export let valueFormatter = null;

  const dispatch = createEventDispatcher();

  $: currentIndex = options.findIndex((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return opt.value === value;
    }
    return opt === value;
  });

  $: displayValue = (() => {
    if (valueFormatter) {
      return valueFormatter(value);
    }
    const option = options[currentIndex];
    if (typeof option === 'object' && option !== null && option.label) {
      return option.label;
    }
    return option ?? value;
  })();

  const handleUp = () => {
    if (options.length === 0) return;
    const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
    const nextOption = options[nextIndex];
    const nextValue = typeof nextOption === 'object' && nextOption !== null ? nextOption.value : nextOption;
    dispatch('change', { value: nextValue });
  };

  const handleDown = () => {
    if (options.length === 0) return;
    const nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
    const nextOption = options[nextIndex];
    const nextValue = typeof nextOption === 'object' && nextOption !== null ? nextOption.value : nextOption;
    dispatch('change', { value: nextValue });
  };
</script>

<div class="arrow-selector">
  {#if label}
    <label for={id} class="selector-label">{label}</label>
  {/if}
  <div class="selector-controls">
    <button
      type="button"
      class="arrow-btn arrow-down"
      on:click={handleDown}
      aria-label={`Previous ${label}`}
      title="Previous"
    >
      <span class="arrow-icon" aria-hidden="true">▼</span>
    </button>
    <div class="selector-value" id={id} role="status" aria-live="polite">
      {displayValue}
    </div>
    <button
      type="button"
      class="arrow-btn arrow-up"
      on:click={handleUp}
      aria-label={`Next ${label}`}
      title="Next"
    >
      <span class="arrow-icon" aria-hidden="true">▲</span>
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
    gap: 0;
    background: rgba(0, 0, 0, 0.35);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    overflow: hidden;
  }

  .arrow-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .arrow-btn:hover {
    background: rgba(var(--color-accent-rgb), 0.2);
    color: #fff;
  }

  .arrow-btn:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.5);
    outline-offset: -2px;
    z-index: 1;
  }

  .arrow-btn:active {
    background: rgba(var(--color-accent-rgb), 0.3);
  }

  .arrow-icon {
    font-size: 0.75rem;
    line-height: 1;
  }

  .selector-value {
    flex: 1;
    padding: 8px 12px;
    font-size: 0.95rem;
    font-weight: 600;
    text-align: center;
    color: #fff;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (hover: none) and (pointer: coarse) {
    .arrow-btn {
      width: 44px;
      height: 44px;
    }
    
    .selector-controls {
      min-height: 44px;
    }
  }
</style>
