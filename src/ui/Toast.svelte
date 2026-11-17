<script lang="ts">
  import { currentToast } from './toastMessage.svelte';

  const toast = $derived(currentToast());
</script>

<div class="toast" class:shown={toast.state === 'shown'} role="status">
  {toast.state === 'shown' ? toast.text : ''}
</div>

<style>
  .toast {
    position: fixed;
    left: 50%;
    bottom: 90px;
    transform: translateX(-50%);
    background: var(--ink);
    color: var(--bg);
    padding: 10px 16px;
    border-radius: 12px;
    font-weight: 500;
    font-size: 14px;
    z-index: 20;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
    max-width: 88%;
    text-align: center;
  }
  .toast.shown {
    opacity: 1;
  }
</style>
