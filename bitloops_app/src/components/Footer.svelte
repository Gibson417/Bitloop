<script>
  export let bars = 4;
  export let stepsPerBar = 16;
  export let bpm = 120;
  /** Calculate loop length in seconds */
  $: loopSeconds = (60 / bpm) * (stepsPerBar / 4) * bars;
</script>

<div class="flex justify-between p-2 text-xs bg-panel">
  <span>{bars} bars</span>
  <span>{stepsPerBar} steps/bar</span>
  <span>{bpm} BPM</span>
  <span>{loopSeconds.toFixed(1)} s</span>
</div>

<style>
  .bg-panel { background-color: var(--panel); color: var(--accent); }
</style>