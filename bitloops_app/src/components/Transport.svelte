<script>
  export let playing = false;
  export let follow = false;

  const togglePlay = () => {
    const event = new CustomEvent('toggleplay');
    dispatchEvent(event);
  };
  const toggleFollow = () => {
    const event = new CustomEvent('togglefollow');
    dispatchEvent(event);
  };
</script>

<div class="flex flex-col items-center space-y-2 p-2 bg-panel">
  <button class="bg-accent text-panel px-4 py-2 rounded" on:click={togglePlay}>
    {playing ? 'Stop' : 'Play'}
  </button>
  <button class="bg-panel text-accent border border-accent px-2 py-1 rounded" on:click={toggleFollow}>
    {follow ? 'Following' : 'Free'}
  </button>
</div>

<style>
  .bg-panel { background-color: var(--panel); }
  .text-panel { color: var(--panel); }
  .bg-accent { background-color: var(--accent); }
  .text-accent { color: var(--accent); }
</style>