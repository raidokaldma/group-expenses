<script lang="ts">
  import { isDarkTheme, toggleTheme } from './theme.svelte';

  const dark = $derived(isDarkTheme());
</script>

<button class="theme-toggle" onclick={toggleTheme} aria-label="Switch to {dark ? 'light' : 'dark'} theme">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    {#if dark}
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" />
    {:else}
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    {/if}
  </svg>
</button>

<style>
  .theme-toggle {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--surface);
    border: 1px solid var(--line);
    flex: none;
  }
</style>
