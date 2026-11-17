import type { LedgerEntry, Member } from '../types';
import { splitShares, type CentsByMember } from './splitShares';

export type Balances = {
  paidByMember: CentsByMember;
  shareByMember: CentsByMember;
  /** Positive: the member gets money back. Negative: the member owes. */
  netByMember: CentsByMember;
};

function addCents(centsByMember: CentsByMember, memberId: string, cents: number) {
  centsByMember[memberId] = (centsByMember[memberId] ?? 0) + cents;
}

/** Expects a ledger that only names current members (see ledgerOfMembers). */
export function computeBalances(members: Member[], ledger: LedgerEntry[]): Balances {
  const balances: Balances = { paidByMember: {}, shareByMember: {}, netByMember: {} };
  for (const member of members) {
    balances.paidByMember[member.id] = 0;
    balances.shareByMember[member.id] = 0;
    balances.netByMember[member.id] = 0;
  }

  for (const entry of ledger) {
    if (entry.kind === 'payment') {
      addCents(balances.netByMember, entry.fromId, entry.amountCents);
      addCents(balances.netByMember, entry.toId, -entry.amountCents);
      continue;
    }

    addCents(balances.paidByMember, entry.payerId, entry.amountCents);
    addCents(balances.netByMember, entry.payerId, entry.amountCents);
    for (const [participantId, shareCents] of Object.entries(splitShares(entry))) {
      addCents(balances.shareByMember, participantId, shareCents);
      addCents(balances.netByMember, participantId, -shareCents);
    }
  }
  return balances;
}
