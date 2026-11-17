<script lang="ts">
  import { onDestroy } from 'svelte';
  import { navigateHome } from '../../routing/route.svelte';
  import AppHeader from '../../ui/AppHeader.svelte';
  import { openGroupSession } from './groupSession.svelte';
  import GroupView from './GroupView.svelte';

  // The parent re-creates this component per group, so the ID never changes here.
  let { groupId }: { groupId: string } = $props();

  // svelte-ignore state_referenced_locally
  const session = openGroupSession(groupId);
  onDestroy(session.close);
</script>

{#if session.load.status === 'loading'}
  <!-- Usually loads in a blink from the device's cache, so only a slow load gets a message. -->
  <div class="slow-loading empty">Loading…</div>
{:else if session.load.status === 'ready'}
  <GroupView group={session.load.group} ledger={session.ledger} unsyncedEntryIds={session.unsyncedEntryIds} activity={session.activity} />
{:else}
  <AppHeader />
  <main class="screen-main">
    {#if session.load.status === 'missing'}
      <div class="empty"><b>Group not found</b>The link may be wrong, or the group has been deleted.</div>
      <button class="primary-action" onclick={navigateHome}>Go to start</button>
    {:else if session.load.status === 'unreachable'}
      <div class="empty"><b>Can't open this group offline</b>It hasn't been opened on this device before. It will load when you're back online.</div>
    {:else}
      <div class="empty"><b>Can't load</b>The group couldn't be reached. Reload the page to try again.</div>
    {/if}
  </main>
{/if}

<style>
  .slow-loading {
    padding-top: 30vh;
    animation: appear 0.3s 0.5s both;
  }
  @keyframes appear {
    from {
      opacity: 0;
    }
  }
</style>
