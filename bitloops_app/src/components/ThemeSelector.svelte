<script>
  import { theme } from '../store/themeStore.js';
  
  let currentTheme = 'dark';
  let themes = [];
  
  const unsubscribe = theme.subscribe((value) => {
    currentTheme = value;
  });
  
  themes = theme.getThemes();
  
  const handleThemeChange = (event) => {
    theme.setTheme(event.target.value);
  };
</script>

<div class="theme-selector">
  <label for="theme-select" class="label">Theme</label>
  <select id="theme-select" value={currentTheme} on:change={handleThemeChange} class="theme-select">
    {#each themes as themeOption}
      <option value={themeOption.id}>{themeOption.name}</option>
    {/each}
  </select>
</div>

<style>
  .theme-selector {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .label {
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
  }
  
  .theme-select {
    background: rgba(0, 0, 0, 0.35);
    color: var(--color-text, #fff);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 8px 12px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
  }
  
  .theme-select:focus {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.5);
    outline-offset: 2px;
  }
</style>
