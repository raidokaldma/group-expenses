import type { Expense } from '../types';

export type CentsByMember = Record<string, number>;

function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Equal split in whole cents. Leftover cents go to participants starting from a
 * position derived from the expense ID, so nobody always pays the extra cent.
 */
export function splitShares(expense: Pick<Expense, 'id' | 'amountCents' | 'participantIds'>): CentsByMember {
  const participantIds = [...expense.participantIds].sort();
  const participantCount = participantIds.length;
  const shares: CentsByMember = {};
  if (participantCount === 0) return shares;

  const baseShare = Math.floor(expense.amountCents / participantCount);
  const leftoverCents = expense.amountCents - baseShare * participantCount;
  const startPosition = hashText(expense.id) % participantCount;

  participantIds.forEach((participantId, position) => {
    const rotatedPosition = (position - startPosition + participantCount) % participantCount;
    shares[participantId] = baseShare + (rotatedPosition < leftoverCents ? 1 : 0);
  });
  return shares;
}
