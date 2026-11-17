import { describe, expect, it } from 'vitest';
import type { Group, Member } from '../../shared/types';
import { planGroupEdit, type GroupEditDraft } from './planGroupEdit';

function member(id: string, name: string): Member {
  return { id, name, colorIndex: 0 };
}

function groupWith(name: string, members: Member[]): Group {
  return { id: 'g', name, members, updatedAtMillis: 0 };
}

function draftFor(openedGroup: Group, changes: Partial<GroupEditDraft> = {}): GroupEditDraft {
  return {
    originalName: openedGroup.name,
    name: openedGroup.name,
    memberRows: openedGroup.members.map((openedMember) => ({ member: openedMember, name: openedMember.name, markedForRemoval: false })),
    commaSeparatedNamesToAdd: '',
    ...changes,
  };
}

function editOf(plan: ReturnType<typeof planGroupEdit>) {
  if (plan.kind !== 'edit') throw new Error(`expected an edit, got ${plan.kind}`);
  return plan.edit;
}

describe('planGroupEdit', () => {
  const openedGroup = groupWith('Trip', [member('ann', 'Ann'), member('bob', 'Bob')]);

  it('keeps renames others made while the form was open', () => {
    const liveGroup = groupWith('Riga trip', [member('ann', 'Ann'), member('bob', 'Robert')]);
    const edit = editOf(planGroupEdit(liveGroup, draftFor(openedGroup, { commaSeparatedNamesToAdd: 'Cid' })));
    expect(edit.groupName).toEqual({ kind: 'unchanged' });
    expect(edit.membersToSave.map((saved) => saved.name)).toEqual(['Cid']);
    expect(edit.changes.map((change) => change.kind)).toEqual(['memberAdded']);
  });

  it('writes only what this form changed', () => {
    const edit = editOf(
      planGroupEdit(openedGroup, draftFor(openedGroup, {
        name: 'Riga',
        memberRows: [
          { member: member('ann', 'Ann'), name: 'Anna', markedForRemoval: false },
          { member: member('bob', 'Bob'), name: 'Bob', markedForRemoval: true },
        ],
      })),
    );
    expect(edit.groupName).toEqual({ kind: 'renamed', name: 'Riga' });
    expect(edit.membersToSave).toEqual([member('ann', 'Anna')]);
    expect(edit.memberIdsToDelete).toEqual(['bob']);
  });

  it('skips members someone else removed meanwhile, and names that already exist', () => {
    const liveGroup = groupWith('Trip', [member('ann', 'Ann')]);
    const draft = draftFor(openedGroup, { commaSeparatedNamesToAdd: 'ann' });
    draft.memberRows[1].name = 'Robert';
    expect(editOf(planGroupEdit(liveGroup, draft)).changes).toEqual([]);
  });

  it('skips a rename to a name another member already has', () => {
    const draft = draftFor(openedGroup);
    draft.memberRows[1].name = 'ann';
    expect(editOf(planGroupEdit(openedGroup, draft)).changes).toEqual([]);
  });

  it('refuses to go over the member limit', () => {
    const fullGroup = groupWith('Big', Array.from({ length: 200 }, (_, index) => member(`m${index}`, `M${index}`)));
    expect(planGroupEdit(fullGroup, draftFor(fullGroup, { commaSeparatedNamesToAdd: 'One more' })).kind).toBe('tooManyMembers');
  });
});
