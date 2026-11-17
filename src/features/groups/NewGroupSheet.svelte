<script lang="ts" module>
  export type MemberSuggestion = { kind: 'none' } | { kind: 'sameAs'; groupName: string; memberNames: string[] };
</script>

<script lang="ts">
  import { MAXIMUM_GROUP_NAME_LENGTH, MAXIMUM_MEMBERS } from '../../shared/limits';
  import { onMount } from 'svelte';
  import { createGroup, newGroupId } from '../../data/groupRepository';
  import { navigateToGroup } from '../../routing/route.svelte';
  import { parseMemberNames } from '../../shared/members';
  import { saveInBackground } from '../../ui/saveInBackground';
  import Sheet from '../../ui/Sheet.svelte';
  import { showToast } from '../../ui/toastMessage.svelte';
  import { markCreatedHere } from './createdHere';

  type Props = { memberSuggestion: MemberSuggestion; onClose: () => void };
  let { memberSuggestion, onClose }: Props = $props();

  let name = $state('');
  let commaSeparatedMemberNames = $state('');
  let nameInput: HTMLInputElement;

  onMount(() => nameInput.focus());

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const memberNames = parseMemberNames(commaSeparatedMemberNames);
    if (memberNames.length === 0) return showToast('Add at least one member.');
    if (memberNames.length > MAXIMUM_MEMBERS) return showToast(`A group can have at most ${MAXIMUM_MEMBERS} members.`);

    const groupName = name.trim() || 'New group';
    const groupId = newGroupId();
    saveInBackground(createGroup(groupId, groupName, memberNames));

    markCreatedHere(groupId);
    onClose();
    navigateToGroup({ id: groupId, name: groupName });
  }
</script>

<Sheet title="New group" {onClose}>
  <form onsubmit={submit} novalidate>
    <label class="field-label" for="new-group-name">Name</label>
    <input class="input" id="new-group-name" maxlength={MAXIMUM_GROUP_NAME_LENGTH} placeholder="e.g. Weekend trip" autocomplete="off" bind:value={name} bind:this={nameInput} />

    <label class="field-label" for="new-group-members">
      Members
      {#if memberSuggestion.kind === 'sameAs' && memberSuggestion.memberNames.length > 0}
        <button type="button" class="toggle" onclick={() => (commaSeparatedMemberNames = memberSuggestion.memberNames.join(', '))}>
          Same as {memberSuggestion.groupName.slice(0, 18)}
        </button>
      {/if}
    </label>
    <input
      class="input"
      id="new-group-members"
      placeholder="Names, separated by commas"
      autocomplete="off"
      autocapitalize="words"
      bind:value={commaSeparatedMemberNames}
    />

    <div class="actions">
      <button class="button primary">Create group</button>
    </div>
  </form>
</Sheet>
