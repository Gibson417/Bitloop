<script>
  import { createEventDispatcher } from 'svelte';

  export let bars = 4;
  export let stepsPerBar = 16;
  export let bpm = 120;
  export let loopSeconds = 0;
  export let maxBars = 64;

  const dispatch = createEventDispatcher();
  let fileInput;

  const handleBarsChange = (event) => {
    const value = Number(event.target.value);
    dispatch('changebars', { value });
  };

  const handleStepsChange = (event) => {
    const value = Number(event.target.value);
    dispatch('changesteps', { value });
  };

  const handleExport = () => {
    dispatch('export');
  };

  const handleImportClick = () => {
    fileInput?.click();
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      dispatch('import', { json: text });
    } finally {
      event.target.value = '';
    }
  };
</script>

<footer class="footer">
  <div class="timing">
    <div class="field">
      <label for="bars">Bars</label>
      <div class="input-shell">
        <input
          id="bars"
          type="number"
          min="1"
          max={maxBars}
          value={bars}
          on:change={handleBarsChange}
        />
        <span class="hint">Max {maxBars}</span>
      </div>
    </div>
    <div class="field">
      <label for="steps">Steps / bar</label>
      <div class="input-shell">
        <input
          id="steps"
          type="number"
          min="4"
          max="64"
          step="1"
          value={stepsPerBar}
          on:change={handleStepsChange}
        />
      </div>
    </div>
    <div class="loop-card">
      <span class="loop-label">Loop</span>
      <span class="loop-value">{loopSeconds.toFixed(1)} s</span>
      <span class="loop-sub">{bpm} BPM</span>
    </div>
  </div>
  <div class="actions">
    <button class="ghost" type="button" on:click={handleExport}>Export project</button>
    <button class="primary" type="button" on:click={handleImportClick}>Import</button>
    <input type="file" accept=".json,.bitloops.json" bind:this={fileInput} on:change={handleImport} hidden />
  </div>
</footer>

<style>
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 32px 28px;
    gap: 24px;
    flex-wrap: wrap;
    color: rgba(255, 255, 255, 0.85);
  }

  .timing {
    display: flex;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .field label {
    color: rgba(255, 255, 255, 0.58);
  }

  .input-shell {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  .input-shell input {
    width: 72px;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 0.95rem;
    font-weight: 600;
    appearance: textfield;
    outline: none;
  }

  .input-shell input::-webkit-outer-spin-button,
  .input-shell input::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }

  .hint {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.45);
    letter-spacing: 0.08em;
  }

  .loop-card {
    display: grid;
    gap: 4px;
    padding: 16px 18px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(120, 210, 255, 0.18), rgba(14, 16, 22, 0.9));
    border: 1px solid rgba(120, 210, 255, 0.25);
    min-width: 150px;
  }

  .loop-label {
    text-transform: uppercase;
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.55);
  }

  .loop-value {
    font-size: 1.4rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .loop-sub {
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.55);
    letter-spacing: 0.12em;
  }

  .actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .actions button {
    padding: 12px 18px;
    border-radius: 14px;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .actions button:hover {
    transform: translateY(-2px);
  }

  .ghost {
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }

  .primary {
    border: 1px solid rgba(120, 210, 185, 0.6);
    background: rgba(120, 210, 185, 0.22);
    color: #fff;
    box-shadow: 0 16px 40px rgba(120, 210, 185, 0.3);
  }
</style>
