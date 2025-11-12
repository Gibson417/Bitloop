<script>
  import { createEventDispatcher } from 'svelte';

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

  const dispatch = createEventDispatcher();
  const KNOB_SWEEP = 270;
  const KNOB_OFFSET = KNOB_SWEEP / 2;

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

  const getNormalized = (input) => {
    if (max === min) return 0;
    return (input - min) / (max - min);
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
    
    // Determine step size based on the range
    const range = max - min;
    let wheelStep = step;
    
    // For larger ranges, use a percentage-based step
    if (range > 100) {
      wheelStep = range * 0.01; // 1% of range
    } else if (range > 10) {
      wheelStep = range * 0.02; // 2% of range
    }
    
    // Normalize wheel delta (different browsers have different scales)
    const delta = event.deltaY < 0 ? 1 : -1;
    const nextValue = clamp(numericValue + (delta * wheelStep));
    
    dispatch('input', { value: nextValue });
    dispatch('change', { value: nextValue });
  };

  $: numericValue = clamp(value);
  $: normalized = Math.min(Math.max(getNormalized(numericValue), 0), 1);
  $: rotation = normalized * KNOB_SWEEP - KNOB_OFFSET;
  $: sweep = normalized * KNOB_SWEEP;
  $: formattedValue = formatValue(numericValue);
</script>

<label class={`knob-control ${className}`}>
  {#if label}
    <span class="knob-label">{label}</span>
  {/if}
  <div class="knob-shell" on:wheel={handleWheel}>
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={numericValue}
      on:input={handleInput}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={numericValue}
      aria-valuetext={formattedValue}
      class="knob-input"
      disabled={disabled}
    />
    <div
      class="knob-face"
      style={`--rotation: ${rotation}deg; --sweep: ${sweep}deg; --accent: ${accent};`}
    >
      <div class="knob-ring"></div>
      <div class="knob-pointer"></div>
      <div class="knob-center"></div>
    </div>
  </div>
  <span class="knob-value">{formattedValue}</span>
</label>

<style>
  .knob-control {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.8rem;
    text-align: center;
    user-select: none;
  }

  .knob-label {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.7);
  }

  .knob-shell {
    position: relative;
    width: 72px;
    height: 72px;
    cursor: pointer;
  }
  
  .knob-shell:hover .knob-face {
    box-shadow: inset 0 4px 12px rgba(0, 0, 0, 0.6), 0 6px 20px rgba(var(--color-accent-rgb), 0.25);
  }

  .knob-input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    padding: 0;
    border: none;
    background: none;
    -webkit-appearance: none;
    appearance: none;
  }

  .knob-face {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.16), rgba(10, 12, 18, 0.92));
    box-shadow: inset 0 4px 12px rgba(0, 0, 0, 0.6), 0 6px 16px rgba(0, 0, 0, 0.45);
    pointer-events: none;
    transition: box-shadow 0.2s ease;
  }

  .knob-input:focus-visible + .knob-face {
    box-shadow: 0 0 0 3px rgba(var(--color-accent-rgb), 0.45), inset 0 4px 12px rgba(0, 0, 0, 0.6);
  }

  .knob-ring {
    position: absolute;
    inset: 8px;
    border-radius: 50%;
    background: conic-gradient(from -135deg, var(--accent) var(--sweep), rgba(255, 255, 255, 0.18) var(--sweep));
    mask: radial-gradient(circle, rgba(0, 0, 0, 0) 58%, rgba(0, 0, 0, 1) 60%);
    -webkit-mask: radial-gradient(circle, rgba(0, 0, 0, 0) 58%, rgba(0, 0, 0, 1) 60%);
  }

  .knob-pointer {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 6px;
    height: 24px;
    border-radius: 4px;
    background: var(--accent);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
    transform: translate(-50%, -50%) rotate(var(--rotation)) translateY(-20px);
    transform-origin: center center;
  }

  .knob-center {
    position: absolute;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.45);
  }

  .knob-value {
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: rgba(255, 255, 255, 0.82);
  }

  .knob-control:has(.knob-input:disabled) {
    opacity: 0.5;
  }
</style>
