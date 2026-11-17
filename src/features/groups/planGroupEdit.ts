import type { GroupEdit } from '../../data/groupRepository';
import { MAXIMUM_MEMBERS } from '../../shared/limits';
import { findMember, findMemberByName, nextColorIndex, parseMemberNames } from '../../shared/members';
import { randomId } from '../../shared/randomId';
import type { Group, Member } from '../../shared/types';

/** `member` is the member as it was when the form opened. */
export type MemberRow = { member: Member; name: string; markedForRemoval: boolean };

export type GroupEditDraft = {
  /** The group name when the form opened. */
  originalName: string;
  name: string;
  memberRows: MemberRow[];
  commaSeparatedNamesToAdd: string;
};

export type GroupEditPlan = { kind: 'edit'; edit: GroupEdit } | { kind: 'tooManyMembers' };

/**
 * Turns the edit form into the minimal set of changes, each logged as one activity entry.
 * Only what this form changed is written, so edits others made while it was open are kept.
 */
export function planGroupEdit(group: Group, draft: GroupEditDraft): GroupEditPlan {
  const membersToSave: Member[] = [];
  const memberIdsToDelete: string[] = [];
  const changes: GroupEdit['changes'] = [];
  // The member list as it will be after the edit, used to match added names and pick free colours.
  let membersAfterEdit = [...group.members];

  for (const row of draft.memberRows) {
    const liveMember = findMember(group, row.member.id);
    if (!liveMember) continue;

    if (row.markedForRemoval) {
      changes.push({ kind: 'memberRemoved', member: liveMember });
      memberIdsToDelete.push(liveMember.id);
      membersAfterEdit = membersAfterEdit.filter((member) => member.id !== liveMember.id);
      continue;
    }
    const newName = row.name.trim();
    if (newName === '' || newName === row.member.name || newName === liveMember.name) continue;
    const sameNameMember = findMemberByName(membersAfterEdit, newName);
    if (sameNameMember && sameNameMember.id !== liveMember.id) continue;

    const renamedMember = { ...liveMember, name: newName };
    changes.push({ kind: 'memberRenamed', member: renamedMember, previousName: liveMember.name });
    membersToSave.push(renamedMember);
    membersAfterEdit = membersAfterEdit.map((member) => (member.id === renamedMember.id ? renamedMember : member));
  }

  for (const nameToAdd of parseMemberNames(draft.commaSeparatedNamesToAdd)) {
    if (findMemberByName(membersAfterEdit, nameToAdd)) continue;
    if (membersAfterEdit.length >= MAXIMUM_MEMBERS) return { kind: 'tooManyMembers' };

    const addedMember: Member = { id: randomId(), name: nameToAdd, colorIndex: nextColorIndex(membersAfterEdit) };
    membersToSave.push(addedMember);
    membersAfterEdit.push(addedMember);
    changes.push({ kind: 'memberAdded', member: addedMember });
  }

  const newGroupName = draft.name.trim();
  const isRenamed = newGroupName !== '' && newGroupName !== draft.originalName && newGroupName !== group.name;
  if (isRenamed) changes.unshift({ kind: 'groupRenamed', name: newGroupName });

  return {
    kind: 'edit',
    edit: {
      groupName: isRenamed ? { kind: 'renamed', name: newGroupName } : { kind: 'unchanged' },
      membersToSave,
      memberIdsToDelete,
      changes,
    },
  };
}
