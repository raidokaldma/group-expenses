import { describe, expect, it } from 'vitest';
import type { Expense, LedgerEntry, Member, Payment } from '../types';
import { ledgerOfMembers } from '../ledgerOfMembers';
import { computeBalances } from './computeBalances';
import { parseAmount } from './parseAmount';
import { settleUp, settleUpAfterPayments } from './settleUp';
import { parseWeight } from './parseWeight';
import { isSplitEvenly, splitShares } from './splitShares';

function member(id: string): Member {
  return { id, name: id, colorIndex: 0 };
}

function expense(
  id: string,
  amountCents: number,
  payerId: string,
  participantIds: string[],
  weightByParticipantId = Object.fromEntries(participantIds.map((participantId) => [participantId, 1])),
): Expense {
  return { kind: 'expense', id, amountCents, description: '', date: '2026-01-01', createdAtMillis: 0, payerId, participantIds, weightByParticipantId };
}

describe('parseAmount', () => {
  it('accepts comma and dot decimals', () => {
    expect(parseAmount('12,50')).toEqual({ kind: 'valid', cents: 1250 });
    expect(parseAmount('12.5 €')).toEqual({ kind: 'valid', cents: 1250 });
  });

  it('accepts sums', () => {
    expect(parseAmount('10+2,5-1')).toEqual({ kind: 'valid', cents: 1150 });
  });

  it('rejects empty, zero, negative and malformed input', () => {
    for (const text of ['', '0', '5-10', '1..2', '10+', 'abc']) {
      expect(parseAmount(text)).toEqual({ kind: 'invalid' });
    }
  });
});

describe('splitShares', () => {
  it('always adds up to the full amount', () => {
    const shares = splitShares(expense('e1', 1000, 'a', ['a', 'b', 'c']));
    expect(Object.values(shares).sort()).toEqual([333, 333, 334]);
  });

  it('splits in proportion to the weights', () => {
    expect(splitShares(expense('e1', 9000, 'a', ['a', 'b', 'c'], { a: 2, b: 1, c: 1.5 }))).toEqual({ a: 4000, b: 2000, c: 3000 });
  });

  it('gives leftover cents to the largest remainders and still adds up', () => {
    const shares = splitShares(expense('e1', 1000, 'a', ['a', 'b', 'c'], { a: 0.5, b: 1, c: 1.5 }));
    expect(shares).toEqual({ a: 167, b: 333, c: 500 });
  });

  it('tells even splits from weighted ones', () => {
    expect(isSplitEvenly(expense('e1', 1000, 'a', ['a', 'b'], { a: 2, b: 2 }))).toBe(true);
    expect(isSplitEvenly(expense('e1', 1000, 'a', ['a', 'b'], { a: 2, b: 1 }))).toBe(false);
  });
});

describe('parseWeight', () => {
  it('accepts whole numbers and comma or dot decimals', () => {
    expect(parseWeight('2')).toEqual({ kind: 'valid', weight: 2 });
    expect(parseWeight('1,5')).toEqual({ kind: 'valid', weight: 1.5 });
    expect(parseWeight('.5')).toEqual({ kind: 'valid', weight: 0.5 });
  });

  it('rejects empty, zero, negative and malformed input', () => {
    for (const text of ['', '0', '-1', '1,2,3', 'abc', '1e3']) {
      expect(parseWeight(text)).toEqual({ kind: 'invalid' });
    }
  });
});

describe('computeBalances', () => {
  it('nets expenses and payments to zero', () => {
    const ledger: LedgerEntry[] = [
      expense('e1', 3000, 'a', ['a', 'b', 'c']),
      { kind: 'payment', id: 'p1', amountCents: 1000, date: '2026-01-01', createdAtMillis: 0, fromId: 'b', toId: 'a' },
    ];
    const balances = computeBalances([member('a'), member('b'), member('c')], ledger);
    expect(balances.netByMember).toEqual({ a: 1000, b: 0, c: -1000 });
  });

  it('leaves out members who no longer exist, the way removing a member does', () => {
    const ledger: LedgerEntry[] = [
      expense('paidByGone', 900, 'gone', ['a', 'b']),
      expense('sharedWithGone', 3000, 'a', ['a', 'b', 'gone']),
      { kind: 'payment', id: 'p1', amountCents: 500, date: '2026-01-01', createdAtMillis: 0, fromId: 'gone', toId: 'a' },
    ];
    const members = [member('a'), member('b')];
    const balances = computeBalances(members, ledgerOfMembers(ledger, members));
    expect(balances.netByMember).toEqual({ a: 1500, b: -1500 });
  });
});

describe('settleUp', () => {
  it('returns nothing when everyone is settled', () => {
    expect(settleUp({ a: 0, b: 0 })).toEqual([]);
  });

  it('finds independent pairs instead of chaining everyone', () => {
    const transfers = settleUp({ a: 500, b: -500, c: 300, d: -300 });
    expect(transfers).toEqual([
      { fromId: 'b', toId: 'a', amountCents: 500 },
      { fromId: 'd', toId: 'c', amountCents: 300 },
    ]);
  });

  it('settles every balance', () => {
    const net: Record<string, number> = { a: 700, b: -200, c: -400, d: -100 };
    for (const transfer of settleUp(net)) {
      net[transfer.fromId] += transfer.amountCents;
      net[transfer.toId] -= transfer.amountCents;
    }
    expect(Object.values(net).every((cents) => cents === 0)).toBe(true);
  });
});

describe('settleUpAfterPayments', () => {
  function payment(fromId: string, toId: string, amountCents: number): Payment {
    return { kind: 'payment', id: `${fromId}-${toId}`, amountCents, date: '2026-01-01', createdAtMillis: 0, fromId, toId };
  }

  it('keeps the other transfers when a suggested one is paid', () => {
    // From these balances, planning afresh after e pays b would reshuffle the rest.
    const net = { a: -2000, b: 4000, c: 3000, d: 1000, e: -6000 };
    const plan = settleUp(net);
    const paid = plan.find((transfer) => transfer.fromId === 'e' && transfer.toId === 'b')!;
    const netAfterPayment = { ...net, e: net.e + paid.amountCents, b: net.b - paid.amountCents };

    expect(settleUpAfterPayments(netAfterPayment, [payment('e', 'b', paid.amountCents)])).toEqual(
      plan.filter((transfer) => transfer !== paid),
    );
  });

  it('plans afresh when a payment does not fit the plan', () => {
    const net = { a: 0, b: 1000, c: -1000 };
    expect(settleUpAfterPayments(net, [payment('a', 'c', 1000)])).toEqual([{ fromId: 'c', toId: 'b', amountCents: 1000 }]);
  });
});
