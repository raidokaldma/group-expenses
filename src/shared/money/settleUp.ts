import type { Payment } from '../types';
import type { CentsByMember } from './splitShares';

export type Transfer = { fromId: string; toId: string; amountCents: number };

type MemberBalance = { memberId: string; cents: number };

// The exact search visits every subset of members, so it is capped at 2^16 subsets.
const MAXIMUM_MEMBERS_FOR_EXACT_SEARCH = 16;

/**
 * Fewest transfers that settle everyone: split the members into as many
 * zero-sum subgroups as possible, since a subgroup of k members needs k-1 transfers.
 */
export function settleUp(netByMember: CentsByMember): Transfer[] {
  const unsettled = Object.entries(netByMember)
    .filter(([, cents]) => cents !== 0)
    .map(([memberId, cents]) => ({ memberId, cents }));
  if (unsettled.length === 0) return [];

  const subgroups =
    unsettled.length <= MAXIMUM_MEMBERS_FOR_EXACT_SEARCH ? splitIntoZeroSumSubgroups(unsettled) : [unsettled];

  return subgroups.flatMap(transfersWithinSubgroup).sort((a, b) => b.amountCents - a.amountCents);
}

/**
 * Like settleUp, but paying a suggested transfer only removes that transfer.
 * Several plans can be equally short, so planning from the current balances could
 * reshuffle who pays whom after every payment. Instead, plan from the balances before
 * any payments and subtract each payment from its transfer. Falls back to planning from
 * the current balances when a payment does not fit the plan.
 */
export function settleUpAfterPayments(netByMember: CentsByMember, payments: Payment[]): Transfer[] {
  const netBeforePayments = { ...netByMember };
  for (const payment of payments) {
    netBeforePayments[payment.fromId] -= payment.amountCents;
    netBeforePayments[payment.toId] += payment.amountCents;
  }

  const transfers = settleUp(netBeforePayments);
  for (const payment of payments) {
    const transfer = transfers.find((candidate) => candidate.fromId === payment.fromId && candidate.toId === payment.toId);
    if (!transfer || transfer.amountCents < payment.amountCents) return settleUp(netByMember);
    transfer.amountCents -= payment.amountCents;
  }
  return transfers.filter((transfer) => transfer.amountCents > 0);
}

/** Dynamic programming over subsets, where each subset is a bitmask of member positions. */
function splitIntoZeroSumSubgroups(balances: MemberBalance[]): MemberBalance[][] {
  const memberCount = balances.length;
  const subsetCount = 1 << memberCount;
  const sumOfSubset = new Float64Array(subsetCount);
  const zeroSumGroupsInSubset = new Int8Array(subsetCount);
  const memberToRemoveFromSubset = new Int8Array(subsetCount);

  for (let subset = 1; subset < subsetCount; subset++) {
    const lowestBit = subset & -subset;
    sumOfSubset[subset] = sumOfSubset[subset ^ lowestBit] + balances[31 - Math.clz32(lowestBit)].cents;

    let bestGroupCount = -1;
    let bestMember = 0;
    for (let member = 0; member < memberCount; member++) {
      if (!((subset >> member) & 1)) continue;
      const groupCount = zeroSumGroupsInSubset[subset ^ (1 << member)];
      if (groupCount > bestGroupCount) {
        bestGroupCount = groupCount;
        bestMember = member;
      }
    }
    zeroSumGroupsInSubset[subset] = bestGroupCount + (sumOfSubset[subset] === 0 ? 1 : 0);
    memberToRemoveFromSubset[subset] = bestMember;
  }

  const subgroups: MemberBalance[][] = [];
  let currentSubgroup: MemberBalance[] = [];
  let remaining = subsetCount - 1;
  while (remaining !== 0) {
    const member = memberToRemoveFromSubset[remaining];
    currentSubgroup.push(balances[member]);
    remaining ^= 1 << member;
    if (sumOfSubset[remaining] === 0) {
      subgroups.push(currentSubgroup);
      currentSubgroup = [];
    }
  }
  if (currentSubgroup.length > 0) subgroups.push(currentSubgroup);
  return subgroups;
}

function transfersWithinSubgroup(subgroup: MemberBalance[]): Transfer[] {
  const debtors = subgroup
    .filter((balance) => balance.cents < 0)
    .map((balance) => ({ memberId: balance.memberId, cents: -balance.cents }))
    .sort((a, b) => b.cents - a.cents);
  const creditors = subgroup
    .filter((balance) => balance.cents > 0)
    .map((balance) => ({ ...balance }))
    .sort((a, b) => b.cents - a.cents);

  const transfers: Transfer[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountCents = Math.min(debtor.cents, creditor.cents);
    transfers.push({ fromId: debtor.memberId, toId: creditor.memberId, amountCents });
    debtor.cents -= amountCents;
    creditor.cents -= amountCents;
    if (debtor.cents === 0) debtorIndex++;
    if (creditor.cents === 0) creditorIndex++;
  }
  return transfers;
}
