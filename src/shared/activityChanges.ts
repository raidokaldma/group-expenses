import { memberOrUnknown, membersInvolvedIn } from './members';
import type { Expense, ExpenseChange, Group, Payment, PaymentChange } from './types';

export function expenseChange(kind: ExpenseChange['kind'], group: Group, expense: Expense): ExpenseChange {
  return {
    kind,
    expenseId: expense.id,
    description: expense.description,
    amountCents: expense.amountCents,
    members: membersInvolvedIn(group, expense),
  };
}

export function paymentChange(kind: PaymentChange['kind'], group: Group, payment: Payment): PaymentChange {
  return {
    kind,
    paymentId: payment.id,
    amountCents: payment.amountCents,
    from: memberOrUnknown(group, payment.fromId),
    to: memberOrUnknown(group, payment.toId),
  };
}
