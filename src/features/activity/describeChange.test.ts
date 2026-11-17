import { describe, expect, it } from 'vitest';
import type { ActivityChange, Group, Member } from '../../shared/types';
import { describeChange } from './describeChange';

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

describe('describeChange', () => {
  it('builds the sentence from the logged facts', () => {
    expect(describeChange({ kind: 'memberRenamed', member: snapshot('bob', 'Robert'), previousName: 'Bob' }, group)).toBe(
      'renamed Bob to Robert',
    );
    expect(describeChange({ ...dinner, kind: 'expenseDeleted', description: '' }, group)).toMatch(/^deleted an expense · /);
  });
});
