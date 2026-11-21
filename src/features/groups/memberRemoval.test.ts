import { describe, expect, it } from 'vitest';
import type { Expense, Member, Payment } from '../../shared/types';
import { describeRemoval, removalEffects } from './memberRemoval';

function expense(id: string, payerId: string, participantIds: string[]): Expense {
  return {
    kind: 'expense',
    id,
    amountCents: 900,
    description: '',
    date: '2026-11-17',
    createdAtMillis: 0,
    payerId,
    participantIds,
    weightByParticipantId: Object.fromEntries(participantIds.map((participantId) => [participantId, 1])),
  };
}

function payment(id: string, fromId: string, toId: string): Payment {
  return { kind: 'payment', id, amountCents: 100, date: '2026-11-17', createdAtMillis: 0, fromId, toId };
}

const members: Member[] = ['ann', 'bob', 'cid'].map((id) => ({ id, name: id, colorIndex: 0 }));

describe('removalEffects', () => {
  const ledger = [
    expense('paidByBob', 'bob', ['ann', 'bob']),
    expense('sharedWithBob', 'ann', ['ann', 'bob', 'cid']),
    expense('onlyForBob', 'ann', ['bob']),
    expense('withoutBob', 'ann', ['ann', 'cid']),
    payment('bobPaysAnn', 'bob', 'ann'),
    payment('cidPaysAnn', 'cid', 'ann'),
  ];

  it('deletes what the member paid and takes them out of other splits', () => {
    const effects = removalEffects('bob', members, ledger);
    expect(effects).toEqual({ deletedExpenseCount: 2, deletedPaymentCount: 1, resplitExpenseCount: 1 });
    expect(describeRemoval(effects)).toBe('Also deletes 2 expenses and 1 payment. Takes them out of 1 shared expense.');
  });

  it('changes nothing for a member without entries', () => {
    expect(describeRemoval(removalEffects('dan', members, ledger))).toBe('');
  });
});
