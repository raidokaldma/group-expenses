import { todayIsoDate } from '../../shared/dates';
import type { Expense, Group, LedgerEntry, Member } from '../../shared/types';

export type ExpenseEditing = { kind: 'new' } | { kind: 'existing'; expense: Expense };

export type ExpenseDraft = {
  amountText: string;
  description: string;
  date: string;
  payerId: string;
  participantIds: string[];
};

function latestExpense(ledger: LedgerEntry[]): Expense | undefined {
  return ledger
    .filter((entry) => entry.kind === 'expense')
    .sort((a, b) => b.createdAtMillis - a.createdAtMillis)[0];
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
  };
}
