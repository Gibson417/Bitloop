<script>
  import { createEventDispatcher } from 'svelte';

  export let active = false;

  const dispatch = createEventDispatcher();

  const handleClick = () => {
    dispatch('toggle', { value: !active });
  };
</script>

<button
  type="button"
  class={`follow-toggle ${active ? 'active' : ''}`}
  on:click={handleClick}
  aria-pressed={active}
  aria-label={active ? 'Disable follow mode' : 'Enable follow mode'}
>
  <span class="label">{active ? 'Follow on' : 'Follow off'}</span>
  <span class="indicator" aria-hidden="true"></span>
</button>

<style>
  .follow-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.75);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .follow-toggle:hover {
    border-color: rgba(var(--color-accent-rgb), 0.5);
    background: rgba(var(--color-accent-rgb), 0.15);
    color: #fff;
  }

  .follow-toggle:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .follow-toggle.active {
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: rgba(var(--color-accent-rgb), 0.2);
    color: #fff;
  }

  .follow-toggle .indicator {
    width: 32px;
    height: 16px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.25);
    position: relative;
    transition: background 0.2s ease;
  }

  .follow-toggle .indicator::after {
    content: '';
    position: absolute;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #fff;
    top: 1px;
    left: 2px;
    transition: transform 0.2s ease;
  }

  .follow-toggle.active .indicator {
    background: rgba(var(--color-accent-rgb), 0.85);
  }

  .follow-toggle.active .indicator::after {
    transform: translateX(14px);
  }

  @media (max-width: 600px) {
    .follow-toggle {
      width: 100%;
      justify-content: center;
    }
  }
</style>
