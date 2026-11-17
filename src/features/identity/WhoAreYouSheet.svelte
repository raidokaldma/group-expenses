<script lang="ts">
  import { saveMember } from '../../data/groupRepository';
  import { MAXIMUM_MEMBER_NAME_LENGTH, MAXIMUM_MEMBERS } from '../../shared/limits';
  import { findMemberByName, nextColorIndex } from '../../shared/members';
  import { randomId } from '../../shared/randomId';
  import type { Group, Member, Viewer } from '../../shared/types';
  import { saveInBackground } from '../../ui/saveInBackground';
  import { showToast } from '../../ui/toastMessage.svelte';
  import MemberChip from '../../ui/MemberChip.svelte';
  import Sheet from '../../ui/Sheet.svelte';

  type Props = {
    group: Group;
    viewer: Viewer;
    onBecomeMember: (member: Member) => void;
    onJustLook: () => void;
    onClose: () => void;
  };
  let { group, viewer, onBecomeMember, onJustLook, onClose }: Props = $props();

  let newName = $state('');
  let nameInput: HTMLInputElement;

  function addMyself(event: SubmitEvent) {
    event.preventDefault();
    const name = newName.trim().slice(0, MAXIMUM_MEMBER_NAME_LENGTH);
    if (name === '') return nameInput.focus();

    const sameNameMember = findMemberByName(group.members, name);
    if (sameNameMember) return onBecomeMember(sameNameMember);
    if (group.members.length >= MAXIMUM_MEMBERS) return showToast(`A group can have at most ${MAXIMUM_MEMBERS} members.`);

    const joiningMember: Member = { id: randomId(), name, colorIndex: nextColorIndex(group.members) };
    // First, so a group's creator joining logs "created the group" before "joined the group".
    onBecomeMember(joiningMember);
    saveInBackground(saveMember(group.id, joiningMember, { actor: joiningMember, change: { kind: 'memberJoined' } }));
  }
</script>

<Sheet title="Who are you?" {onClose}>
  <div class="column">
    <p class="muted">
      Pick your name in {group.name}. It is used to show your balance and to log the changes you make.
    </p>
    <div class="chips">
      {#each group.members as member (member.id)}
        <MemberChip {member} selected={viewer.kind === 'member' && viewer.member.id === member.id} onSelect={() => onBecomeMember(member)} />
      {:else}
        <span class="muted">This group has no members yet.</span>
      {/each}
    </div>
    <form onsubmit={addMyself} novalidate>
      <label class="field-label" for="who-new-name">Not listed? Add your name</label>
      <div class="input-row">
        <input
          class="input"
          id="who-new-name"
          maxlength={MAXIMUM_MEMBER_NAME_LENGTH}
          placeholder="Your name"
          autocomplete="off"
          autocapitalize="words"
          bind:value={newName}
          bind:this={nameInput}
        />
        <button class="button compact primary fit">Add me</button>
      </div>
    </form>
    <div class="actions">
      <button class="button compact" onclick={onJustLook}>Just looking</button>
    </div>
  </div>
</Sheet>
