import type { Expense } from '../types';

export type CentsByMember = Record<string, number>;

function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function isSplitEvenly(expense: Pick<Expense, 'weightByParticipantId'>): boolean {
  const weights = Object.values(expense.weightByParticipantId);
  return weights.every((weight) => weight === weights[0]);
}

/**
 * Split in whole cents, in proportion to each participant's weight. The leftover cents go to the
 * largest rounding remainders. Ties, which an equal split always has, are broken from a position
 * derived from the expense ID, so nobody always pays the extra cent.
 */
export function splitShares(
  expense: Pick<Expense, 'id' | 'amountCents' | 'participantIds' | 'weightByParticipantId'>,
): CentsByMember {
  const participantIds = [...expense.participantIds].sort();
  const participantCount = participantIds.length;
  const shares: CentsByMember = {};
  if (participantCount === 0) return shares;

  const totalWeight = participantIds.reduce((sum, participantId) => sum + expense.weightByParticipantId[participantId], 0);
  const startPosition = hashText(expense.id) % participantCount;
  const exactShares = participantIds.map((participantId, position) => {
    const exactCents = (expense.amountCents * expense.weightByParticipantId[participantId]) / totalWeight;
    const baseCents = Math.floor(exactCents);
    const rotatedPosition = (position - startPosition + participantCount) % participantCount;
    return { participantId, baseCents, remainder: exactCents - baseCents, rotatedPosition };
  });

  let leftoverCents = expense.amountCents - exactShares.reduce((sum, share) => sum + share.baseCents, 0);
  const byLargestRemainder = [...exactShares].sort(
    (first, second) => second.remainder - first.remainder || first.rotatedPosition - second.rotatedPosition,
  );
  for (const share of byLargestRemainder) {
    shares[share.participantId] = share.baseCents + (leftoverCents > 0 ? 1 : 0);
    leftoverCents--;
  }
  return shares;
}
