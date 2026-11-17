import { ledgerOfMembers } from '../../shared/ledgerOfMembers';
import type { LedgerEntry, Member } from '../../shared/types';

export type RemovalEffects = {
  deletedExpenseCount: number;
  deletedPaymentCount: number;
  /** Other people's expenses, from then on split among the remaining participants. */
  resplitExpenseCount: number;
};

/**
 * What removing a member does to the expenses and payments. Nothing is rewritten: entries naming a
 * member who is gone stop counting through ledgerOfMembers, which every screen reads from.
 */
export function removalEffects(memberId: string, members: Member[], ledger: LedgerEntry[]): RemovalEffects {
  const remainingMembers = members.filter((member) => member.id !== memberId);
  const keptEntriesById = new Map(ledgerOfMembers(ledger, remainingMembers).map((entry) => [entry.id, entry]));
  const effects: RemovalEffects = { deletedExpenseCount: 0, deletedPaymentCount: 0, resplitExpenseCount: 0 };
  for (const entry of ledger) {
    const keptEntry = keptEntriesById.get(entry.id);
    if (!keptEntry) {
      if (entry.kind === 'payment') effects.deletedPaymentCount++;
      else effects.deletedExpenseCount++;
    } else if (keptEntry !== entry) {
      effects.resplitExpenseCount++;
    }
  }
  return effects;
}

export function describeRemoval(effects: RemovalEffects): string {
  const deletions = [countOf(effects.deletedExpenseCount, 'expense'), countOf(effects.deletedPaymentCount, 'payment')].filter(
    (part) => part !== '',
  );
  const sentences = [];
  if (deletions.length > 0) sentences.push(`Also deletes ${deletions.join(' and ')}.`);
  if (effects.resplitExpenseCount > 0) sentences.push(`Takes them out of ${countOf(effects.resplitExpenseCount, 'shared expense')}.`);
  return sentences.join(' ');
}

function countOf(count: number, noun: string): string {
  if (count === 0) return '';
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}
