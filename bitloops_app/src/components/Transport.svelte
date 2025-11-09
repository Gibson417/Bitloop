<script>
  import { createEventDispatcher } from 'svelte';

  export let playing = false;
  export let follow = false;

  const dispatch = createEventDispatcher();

  const togglePlay = () => {
    dispatch('toggleplay');
  };

  const toggleFollow = () => {
    dispatch('togglefollow');
  };
</script>

<div class="transport bg-panel text-white p-4 flex md:flex-col gap-3 items-center md:items-stretch" {...$$restProps}>
  <button class="btn btn--primary" type="button" on:click={togglePlay}>
    {playing ? 'Stop' : 'Play'}
  </button>
  <button class="btn btn--outline" type="button" on:click={toggleFollow}>
    {follow ? 'Following' : 'Free'}
  </button>
</div>

<style>
  .transport {
    min-width: 12rem;
  }

  .btn {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 9999px;
    font-weight: 600;
    border: 1px solid transparent;
    cursor: pointer;
    transition: transform 0.15s ease, background-color 0.15s ease;
  }

  .btn:hover {
    transform: translateY(-1px);
  }

  .btn:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }

  .btn--primary {
    background-color: var(--accent);
    color: #0e1016;
  }

  .btn--outline {
    background-color: transparent;
    border-color: var(--accent);
    color: var(--accent);
  }
</style>
