import { describe, expect, it } from 'vitest';
import type { ActivityChange, ActivityEntry, Group, Member } from '../../shared/types';
import { affectsMember } from './affectsMember';
import { membersOfChange } from './membersOfChange';

const group: Group = {
  id: 'g',
  name: 'Trip',
  members: ['ann', 'bob', 'cid'].map((id) => ({ id, name: id.toUpperCase(), colorIndex: 0 })),
  updatedAtMillis: 0,
};

function snapshot(id: string, name = id.toUpperCase()): Member {
  return { id, name, colorIndex: 0 };
}

function activity(actorId: string, change: ActivityChange): ActivityEntry {
  return { id: 'a', createdAtMillis: 0, actor: snapshot(actorId), change };
}

const dinner: ActivityChange = {
  kind: 'expenseAdded',
  expenseId: 'dinner',
  description: 'Dinner',
  amountCents: 3000,
  members: [snapshot('ann', 'Old Ann'), snapshot('dan', 'Dan')],
};

describe('affectsMember', () => {
  function affects(entry: ActivityEntry, memberId: string): boolean {
    return affectsMember(entry, memberId, membersOfChange(entry.change, group));
  }

  it('counts own changes, changes about the member and changes to the group itself', () => {
    expect(affects(activity('bob', { kind: 'memberJoined' }), 'bob')).toBe(true);
    expect(affects(activity('bob', dinner), 'ann')).toBe(true);
    expect(affects(activity('ann', { kind: 'groupRenamed', name: 'Riga' }), 'cid')).toBe(true);
  });

  it('skips changes about other members', () => {
    expect(affects(activity('ann', { kind: 'memberAdded', member: snapshot('bob') }), 'cid')).toBe(false);
    expect(affects(activity('bob', { kind: 'memberJoined' }), 'cid')).toBe(false);
    expect(affects(activity('bob', dinner), 'cid')).toBe(false);
  });
});
