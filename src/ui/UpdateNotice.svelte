<script lang="ts">
  import { isAppUpdateReady, reloadIntoNewVersion } from './appUpdate.svelte';
</script>

{#if isAppUpdateReady()}
  <div class="update" role="status">
    <span>A new version is available.</span>
    <button onclick={reloadIntoNewVersion}>Reload</button>
  </div>
{/if}

<style>
  .update {
    margin: 12px 16px 0;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--accent-soft);
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .update button {
    font-weight: 600;
    color: var(--accent);
    white-space: nowrap;
    padding: 4px 8px;
  }
</style>
