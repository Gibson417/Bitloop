<script>
  import { onDestroy } from 'svelte';
  import { theme } from '../store/themeStore.js';
  import ArrowSelector from './ArrowSelector.svelte';

  let currentTheme = 'dark';
  let themes = theme.getThemes();

  const unsubscribe = theme.subscribe((value) => {
    currentTheme = value;
  });

  const handleThemeChange = (event) => {
    theme.setTheme(event.detail.value);
  };

  // Convert themes to arrow selector format
  $: themeOptions = themes.map(t => ({ value: t.id, label: t.name }));

  onDestroy(() => {
    unsubscribe?.();
  });
</script>

<div class="theme-selector-wrapper">
  <ArrowSelector
    label="Theme"
    options={themeOptions}
    value={currentTheme}
    on:change={handleThemeChange}
  />
</div>

<style>
  .theme-selector-wrapper {
    display: inline-flex;
    min-width: 160px;
    width: 160px;
  }
</style>
