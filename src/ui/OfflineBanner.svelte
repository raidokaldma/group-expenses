<script lang="ts">
  import { isOnline } from './connection.svelte';
</script>

{#if !isOnline()}
  <div class="offline" role="status">You're offline. Changes are kept on this device and sync when you're back online.</div>
{/if}

<style>
  .offline {
    margin: 12px 16px 0;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--owe-soft);
    color: var(--owe);
    font-size: 14px;
    font-weight: 500;
  }
</style>
