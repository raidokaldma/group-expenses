import { todayIsoDate } from '../../shared/dates';
import { parseWeight } from '../../shared/money/parseWeight';
import { isSplitEvenly } from '../../shared/money/splitShares';
import type { Expense, Group, LedgerEntry, Member } from '../../shared/types';

export type ExpenseEditing = { kind: 'new' } | { kind: 'existing'; expense: Expense };

export type SplitKind = 'equal' | 'byWeight';

export type ExpenseDraft = {
  amountText: string;
  description: string;
  date: string;
  payerId: string;
  participantIds: string[];
  splitKind: SplitKind;
  /** Kept for members who are not selected too, so unselecting and selecting again keeps their weight. */
  weightTextByMemberId: Record<string, string>;
};

export type DraftWeights = { kind: 'valid'; weightByParticipantId: Record<string, number> } | { kind: 'invalid' };

const DEFAULT_WEIGHT_TEXT = '1';

function latestExpense(ledger: LedgerEntry[]): Expense | undefined {
  return ledger
    .filter((entry) => entry.kind === 'expense')
    .sort((a, b) => b.createdAtMillis - a.createdAtMillis)[0];
}

function splitOf(expense: Expense | undefined): Pick<ExpenseDraft, 'splitKind' | 'weightTextByMemberId'> {
  if (!expense || isSplitEvenly(expense)) return { splitKind: 'equal', weightTextByMemberId: {} };
  return {
    splitKind: 'byWeight',
    weightTextByMemberId: Object.fromEntries(
      Object.entries(expense.weightByParticipantId).map(([memberId, weight]) => [memberId, String(weight)]),
    ),
  };
}

/** A new expense starts from the previous one's payer and split, since expenses tend to come in runs. */
export function initialExpenseDraft(group: Group, ledger: LedgerEntry[], actor: Member, editing: ExpenseEditing): ExpenseDraft {
  if (editing.kind === 'existing') {
    const { expense } = editing;
    return {
      amountText: (expense.amountCents / 100).toFixed(2),
      description: expense.description,
      date: expense.date || todayIsoDate(),
      payerId: expense.payerId,
      participantIds: [...expense.participantIds],
      ...splitOf(expense),
    };
  }

  const memberIds = group.members.map((member) => member.id);
  const previousExpense = latestExpense(ledger);
  const previousParticipantIds = (previousExpense?.participantIds ?? []).filter((id) => memberIds.includes(id));
  return {
    amountText: '',
    description: '',
    date: todayIsoDate(),
    payerId: previousExpense && memberIds.includes(previousExpense.payerId) ? previousExpense.payerId : actor.id,
    participantIds: previousParticipantIds.length > 0 ? previousParticipantIds : memberIds,
    ...splitOf(previousExpense),
  };
}

export function weightTextOf(draft: ExpenseDraft, memberId: string): string {
  return draft.weightTextByMemberId[memberId] ?? DEFAULT_WEIGHT_TEXT;
}

export function draftWeights(draft: ExpenseDraft, participantIds: string[]): DraftWeights {
  const weightByParticipantId: Record<string, number> = {};
  for (const participantId of participantIds) {
    if (draft.splitKind === 'equal') {
      weightByParticipantId[participantId] = 1;
      continue;
    }
    const parsed = parseWeight(weightTextOf(draft, participantId));
    if (parsed.kind === 'invalid') return { kind: 'invalid' };
    weightByParticipantId[participantId] = parsed.weight;
  }
  return { kind: 'valid', weightByParticipantId };
}
