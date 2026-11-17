import { describe, expect, it } from 'vitest';
import type { ActivityChange, Group, Member } from '../../shared/types';
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

const dinner: ActivityChange = {
  kind: 'expenseAdded',
  expenseId: 'dinner',
  description: 'Dinner',
  amountCents: 3000,
  members: [snapshot('ann', 'Old Ann'), snapshot('dan', 'Dan')],
};

describe('membersOfChange', () => {
  it('prefers current names, and keeps logged ones for members removed since', () => {
    expect(membersOfChange(dinner, group).map((member) => member.name)).toEqual(['ANN', 'Dan']);
  });
});
