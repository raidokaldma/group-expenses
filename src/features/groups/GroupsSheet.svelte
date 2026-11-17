<script lang="ts">
  import { forgetGroup, listRememberedGroups, type RememberedGroup } from '../../local/rememberedGroups';
  import { navigateToGroup } from '../../routing/route.svelte';
  import Sheet from '../../ui/Sheet.svelte';

  type Removal = { step: 'notAsked' } | { step: 'confirming'; groupId: string };

  type Props = { currentGroupId: string; onNewGroup: () => void; onClose: () => void };
  let { currentGroupId, onNewGroup, onClose }: Props = $props();

  let rememberedGroups = $state(listRememberedGroups());
  let removal = $state<Removal>({ step: 'notAsked' });

  function openGroup(rememberedGroup: RememberedGroup) {
    onClose();
    if (rememberedGroup.id !== currentGroupId) navigateToGroup(rememberedGroup);
  }

  function removeFromList(groupId: string) {
    forgetGroup(groupId);
    rememberedGroups = listRememberedGroups();
    removal = { step: 'notAsked' };
  }
</script>

<Sheet title="Groups" {onClose}>
  <p class="muted">
    Groups opened on this device. Removing one only takes it off this list: the group itself stays, and it comes back when you
    open its link again.
  </p>
  <div class="groups">
    {#each rememberedGroups as rememberedGroup (rememberedGroup.id)}
      {@const isCurrent = rememberedGroup.id === currentGroupId}
      <div class="group">
        {#if removal.step === 'confirming' && removal.groupId === rememberedGroup.id}
          <span class="name">Remove {rememberedGroup.name}?</span>
          <button class="button compact danger" onclick={() => removeFromList(rememberedGroup.id)}>Remove</button>
          <button class="button compact fit" onclick={() => (removal = { step: 'notAsked' })}>Keep</button>
        {:else}
          <button class="name open" class:current={isCurrent} onclick={() => openGroup(rememberedGroup)}>
            <span class="label">{rememberedGroup.name}</span>
            {#if isCurrent}<small>currently open</small>{/if}
          </button>
          <!-- The open group would be re-added at once, so it can't be removed from here. -->
          {#if !isCurrent}
            <button
              class="remove"
              aria-label="Remove {rememberedGroup.name} from this list"
              onclick={() => (removal = { step: 'confirming', groupId: rememberedGroup.id })}
            >
              ✕
            </button>
          {/if}
        {/if}
      </div>
    {/each}
  </div>
  <div class="actions">
    <button class="button primary" onclick={onNewGroup}>New group</button>
  </div>
</Sheet>

<style>
  .group {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 54px;
    border-bottom: 1px solid var(--line);
  }
  .name {
    flex: 1;
    min-width: 0;
    font-weight: 600;
  }
  .open {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 4px;
    text-align: left;
  }
  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .open small {
    font-weight: 400;
    color: var(--muted);
    margin-left: auto;
    white-space: nowrap;
  }
  .current {
    color: var(--accent);
  }
  .remove {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    border: 1px solid var(--line);
    color: var(--muted);
    flex: none;
    font-size: 16px;
  }
</style>
