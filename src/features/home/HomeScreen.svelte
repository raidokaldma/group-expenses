<script lang="ts">
  import { listRememberedGroups } from '../../local/rememberedGroups';
  import { navigateToGroup } from '../../routing/route.svelte';
  import AppHeader from '../../ui/AppHeader.svelte';
  import NewGroupSheet from '../groups/NewGroupSheet.svelte';

  const rememberedGroups = listRememberedGroups();
  let newGroupSheet = $state<'closed' | 'open'>('closed');

  $effect(() => {
    document.title = 'Group expenses';
  });
</script>

<AppHeader />

<main class="screen-main">
  {#if rememberedGroups.length > 0}
    <div class="day-label">Your groups on this device</div>
    <div class="list">
      {#each rememberedGroups as rememberedGroup (rememberedGroup.id)}
        <button class="row" onclick={() => navigateToGroup(rememberedGroup)}>
          <span class="row-main"><span class="row-title">{rememberedGroup.name}</span></span>
        </button>
      {/each}
    </div>
  {:else}
    <section class="intro">
      <h2>Split expenses with friends</h2>
      <p>Keep track of who paid for what on a trip or at an event, and see who owes whom at the end.</p>
      <ul>
        <li>No sign-up and no login.</li>
        <li>Create a group and share its link.</li>
        <li>Everyone with the link can add and change expenses.</li>
      </ul>
    </section>
  {/if}
  <button class="primary-action" onclick={() => (newGroupSheet = 'open')}>Create a group</button>
</main>

{#if newGroupSheet === 'open'}
  <NewGroupSheet memberSuggestion={{ kind: 'none' }} onClose={() => (newGroupSheet = 'closed')} />
{/if}

<style>
  .intro {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 18px;
  }
  .intro h2 {
    margin: 0 0 6px;
    font: 700 20px var(--display);
  }
  .intro p {
    margin: 0 0 10px;
    color: var(--muted);
  }
  .intro ul {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
</style>
