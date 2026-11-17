<script lang="ts">
  import { applyGroupEdit, deleteGroup } from '../../data/groupRepository';
  import { forgetGroup } from '../../local/rememberedGroups';
  import { currentRoute, navigateHome } from '../../routing/route.svelte';
  import { MAXIMUM_GROUP_NAME_LENGTH, MAXIMUM_MEMBER_NAME_LENGTH, MAXIMUM_MEMBERS } from '../../shared/limits';
  import type { Group, LedgerEntry, Member } from '../../shared/types';
  import { attemptSave } from '../../ui/attemptSave';
  import { isOnline } from '../../ui/connection.svelte';
  import { saveInBackground } from '../../ui/saveInBackground';
  import { showToast } from '../../ui/toastMessage.svelte';
  import Avatar from '../../ui/Avatar.svelte';
  import Sheet from '../../ui/Sheet.svelte';
  import { describeRemoval, removalEffects } from './memberRemoval';
  import { planGroupEdit, type MemberRow } from './planGroupEdit';

  type Props = { group: Group; ledger: LedgerEntry[]; actor: Member; onClose: () => void };
  let { group, ledger, actor, onClose }: Props = $props();

  // The form edits a snapshot taken when the sheet opens; live updates must not overwrite what is being typed.
  // svelte-ignore state_referenced_locally
  const originalName = group.name;
  let name = $state(originalName);
  // svelte-ignore state_referenced_locally
  let memberRows = $state<MemberRow[]>(group.members.map((member) => ({ member, name: member.name, markedForRemoval: false })));
  let commaSeparatedNamesToAdd = $state('');
  let deletion = $state<'notAsked' | 'confirming'>('notAsked');
  let typedGroupName = $state('');
  const typedNameMatches = $derived(typedGroupName.trim().toLowerCase() === group.name.trim().toLowerCase());

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const plan = planGroupEdit(group, { originalName, name, memberRows, commaSeparatedNamesToAdd });
    if (plan.kind === 'tooManyMembers') return showToast(`A group can have at most ${MAXIMUM_MEMBERS} members.`);
    if (plan.edit.changes.length === 0) return onClose();

    saveInBackground(applyGroupEdit(group.id, actor, plan.edit));
    showToast('Group updated');
    onClose();
  }

  function removalWarning(memberId: string): string {
    return describeRemoval(removalEffects(memberId, group.members, ledger));
  }

  function cancelDeletion() {
    deletion = 'notAsked';
    typedGroupName = '';
  }

  // The confirmation field sits inside the edit form, where Enter would otherwise save the group.
  function ignoreEnter(event: KeyboardEvent) {
    if (event.key === 'Enter') event.preventDefault();
  }

  async function deleteForEveryone() {
    if (!typedNameMatches) return;
    if (!isOnline()) return showToast('Go online to delete a group.');
    // This sheet is torn down as soon as the group disappears, so read what is needed first.
    const groupId = group.id;
    const outcome = await attemptSave(() => deleteGroup(groupId), `Deleted ${group.name}`);
    if (outcome === 'failed') return;
    forgetGroup(groupId);
    // Deleting takes a moment; whoever moved on to another group meanwhile stays there.
    const route = currentRoute();
    if (route.name === 'group' && route.groupId === groupId) navigateHome();
  }
</script>

<Sheet title="Edit group" {onClose}>
  <form onsubmit={submit} novalidate>
    <label class="field-label" for="group-name">Group name</label>
    <input class="input" id="group-name" maxlength={MAXIMUM_GROUP_NAME_LENGTH} autocomplete="off" bind:value={name} />

    <div class="field-label">Members</div>
    <div class="column">
      {#each memberRows as row (row.member.id)}
        <div class="input-row" class:marked-for-removal={row.markedForRemoval}>
          <Avatar name={row.member.name} colorIndex={row.member.colorIndex} />
          <input class="input" maxlength={MAXIMUM_MEMBER_NAME_LENGTH} autocomplete="off" aria-label="Name of {row.member.name}" bind:value={row.name} />
          <button
            type="button"
            class="remove"
            aria-label="{row.markedForRemoval ? 'Keep' : 'Remove'} {row.member.name}"
            onclick={() => (row.markedForRemoval = !row.markedForRemoval)}
          >
            {row.markedForRemoval ? '↺' : '✕'}
          </button>
        </div>
        {#if row.markedForRemoval}
          {@const warning = removalWarning(row.member.id)}
          {#if warning !== ''}<small class="removal-warning">{warning}</small>{/if}
        {/if}
      {/each}
    </div>

    <label class="field-label" for="group-add-members">Add members</label>
    <input
      class="input"
      id="group-add-members"
      placeholder="More names, separated by commas"
      autocomplete="off"
      autocapitalize="words"
      bind:value={commaSeparatedNamesToAdd}
    />

    <div class="actions">
      <button class="button primary">Save changes</button>
    </div>

    <div class="danger-zone">
      {#if deletion === 'notAsked'}
        <button type="button" class="button compact danger" onclick={() => (deletion = 'confirming')}>Delete group…</button>
      {:else}
        <b>Delete {group.name} with all its expenses? This can't be undone.</b>
        <label class="field-label" for="delete-confirmation">Type the group name to confirm</label>
        <input
          class="input"
          id="delete-confirmation"
          autocomplete="off"
          autocapitalize="off"
          placeholder={group.name}
          bind:value={typedGroupName}
          onkeydown={ignoreEnter}
        />
        <div class="actions">
          <button type="button" class="button compact danger" disabled={!typedNameMatches} onclick={deleteForEveryone}>
            Delete for everyone
          </button>
          <button type="button" class="button compact fit" onclick={cancelDeletion}>Cancel</button>
        </div>
      {/if}
    </div>
  </form>
</Sheet>

<style>
  .marked-for-removal input {
    text-decoration: line-through;
    opacity: 0.5;
  }
  .removal-warning {
    color: var(--owe);
    margin: -4px 0 0 42px;
  }
  .remove {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    border: 1px solid var(--line);
    color: var(--owe);
    flex: none;
    font-size: 18px;
  }
  .danger-zone {
    border-top: 1px solid var(--line);
    padding-top: 12px;
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .danger-zone .actions {
    margin: 0;
  }
</style>
