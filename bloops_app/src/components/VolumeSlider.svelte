<script>
  import { createEventDispatcher } from 'svelte';
  import { spacing, radius, touchTarget } from '../lib/colorTokens.js';

  export let id = '';
  export let label = '';
  export let value = 0;
  export let min = 0;
  export let max = 1;
  export let step = 0.01;
  export let accent = 'var(--color-accent)';
  export let disabled = false;
  export let valueFormatter = null;
  export let className = '';
  export let defaultValue = null;

  const dispatch = createEventDispatcher();

  const clamp = (input) => {
    if (!Number.isFinite(input)) return min;
    if (input < min) return min;
    if (input > max) return max;
    return input;
  };

  const formatValue = (input) => {
    if (typeof valueFormatter === 'function') {
      return valueFormatter(input);
    }
    if (!Number.isFinite(input)) return '0';
    if (step >= 1) {
      return Math.round(input).toString();
    }
    if (step >= 0.1) {
      return input.toFixed(1);
    }
    return input.toFixed(2);
  };

  const handleInput = (event) => {
    const raw = Number(event.target.value);
    const nextValue = clamp(raw);
    dispatch('input', { value: nextValue });
    dispatch('change', { value: nextValue });
  };

  const handleWheel = (event) => {
    if (disabled) return;
    event.preventDefault();
    
    const range = max - min;
    let wheelStep = step;
    
    if (range > 100) {
      wheelStep = range * 0.01;
    } else if (range > 10) {
      wheelStep = range * 0.02;
    }
    
    const delta = event.deltaY < 0 ? 1 : -1;
    const nextValue = clamp(numericValue + (delta * wheelStep));
    
    dispatch('input', { value: nextValue });
    dispatch('change', { value: nextValue });
  };

  const handleDoubleClick = (event) => {
    if (disabled) return;
    event.preventDefault();
    
    const resetValue = defaultValue !== null ? defaultValue : (min + max) / 2;
    const nextValue = clamp(resetValue);
    
    dispatch('input', { value: nextValue });
    dispatch('change', { value: nextValue });
    dispatch('reset', { value: nextValue });
  };

  const handleKeyDown = (event) => {
    if (disabled) return;
    
    let delta = 0;
    const largeStep = (max - min) * 0.1;
    
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        event.preventDefault();
        delta = event.shiftKey ? largeStep : step;
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        event.preventDefault();
        delta = event.shiftKey ? -largeStep : -step;
        break;
      case 'Home':
        event.preventDefault();
        delta = min - numericValue;
        break;
      case 'End':
        event.preventDefault();
        delta = max - numericValue;
        break;
      default:
        return;
    }
    
    const nextValue = clamp(numericValue + delta);
    dispatch('input', { value: nextValue });
    dispatch('change', { value: nextValue });
  };

  $: numericValue = clamp(value);
  $: normalized = Math.min(Math.max((numericValue - min) / (max - min || 1), 0), 1);
  $: formattedValue = formatValue(numericValue);
</script>

<div class={`volume-slider ${className} ${disabled ? 'is-disabled' : ''}`} data-component="VolumeSlider">
  <div class="slider-header">
    {#if label}
      <label for={id} class="slider-label">{label}</label>
    {/if}
    <span class="slider-value" aria-live="polite">{formattedValue}</span>
  </div>
  <div 
    class="slider-track-container"
    on:wheel={handleWheel}
    on:dblclick={handleDoubleClick}
    role="group"
    aria-label="Volume control - double-click to reset"
  >
    <div class="slider-track">
      <div 
        class="slider-fill" 
        style={`width: ${normalized * 100}%; background: ${accent};`}
      ></div>
      <div 
        class="slider-thumb" 
        style={`left: ${normalized * 100}%; background: ${accent};`}
      ></div>
    </div>
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={numericValue}
      on:input={handleInput}
      on:keydown={handleKeyDown}
      aria-label={label || 'Volume'}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={numericValue}
      aria-valuetext={formattedValue}
      class="slider-input"
      disabled={disabled}
    />
  </div>
</div>

<style>
  .volume-slider {
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: var(--color-text);
    user-select: none;
    width: 100%;
    max-width: 240px;
  }

  .slider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .slider-label {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-muted);
    margin: 0;
  }

  .slider-value {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--color-text);
    min-width: 42px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .slider-track-container {
    position: relative;
    height: 44px;
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 0 4px;
  }

  .slider-track {
    position: relative;
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.12);
    border-radius: 999px;
    overflow: visible;
  }

  .slider-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    border-radius: 999px;
    transition: width 0.05s ease-out;
    opacity: 0.7;
  }

  .slider-thumb {
    position: absolute;
    top: 50%;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1),
                box-shadow 0.15s ease;
    pointer-events: none;
  }

  .slider-input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    margin: 0;
    padding: 0;
    -webkit-appearance: none;
    appearance: none;
  }

  /* Touch target - minimum 44px */
  .slider-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 44px;
    height: 44px;
    cursor: pointer;
  }

  .slider-input::-moz-range-thumb {
    width: 44px;
    height: 44px;
    cursor: pointer;
    border: none;
    background: transparent;
  }

  /* Hover & Focus States */
  .slider-track-container:hover .slider-thumb {
    transform: translate(-50%, -50%) scale(1.15);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  .slider-input:focus-visible ~ .slider-track .slider-thumb {
    transform: translate(-50%, -50%) scale(1.25);
    box-shadow: 0 0 0 3px rgba(var(--color-accent-rgb), 0.35),
                0 4px 12px rgba(0, 0, 0, 0.4);
  }

  .slider-input:active ~ .slider-track .slider-thumb {
    transform: translate(-50%, -50%) scale(1.1);
  }

  /* Disabled State - using class for better browser compatibility */
  .volume-slider.is-disabled {
    opacity: 0.4;
    pointer-events: none;
  }
  
  /* Fallback for browsers that support :has() */
  .volume-slider:has(.slider-input:disabled) {
    opacity: 0.4;
    pointer-events: none;
  }

  /* Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    .slider-fill,
    .slider-thumb {
      transition: none;
    }
  }
</style>
