export type Member = {
  id: string;
  name: string;
  colorIndex: number;
};

export type Group = {
  id: string;
  name: string;
  members: Member[];
  /** When anything in the group last changed: the security rules make every write bump it. */
  updatedAtMillis: number;
};

export type Expense = {
  kind: 'expense';
  id: string;
  amountCents: number;
  description: string;
  /** Calendar day as YYYY-MM-DD. */
  date: string;
  createdAtMillis: number;
  payerId: string;
  participantIds: string[];
  /** How many parts of the amount each participant takes. Equal weights split evenly. */
  weightByParticipantId: Record<string, number>;
};

/** A settle-up transfer between two members. */
export type Payment = {
  kind: 'payment';
  id: string;
  amountCents: number;
  date: string;
  createdAtMillis: number;
  fromId: string;
  toId: string;
};

export type LedgerEntry = Expense | Payment;

/** What one activity entry records. The sentence shown for it is built when it is displayed. */
export type ActivityChange =
  | { kind: 'groupCreated' }
  | { kind: 'groupRenamed'; name: string }
  | { kind: 'memberJoined' }
  | { kind: 'memberAdded'; member: Member }
  | { kind: 'memberRemoved'; member: Member }
  | { kind: 'memberRenamed'; member: Member; previousName: string }
  | ExpenseChange
  | PaymentChange;

export type ExpenseChange = {
  kind: 'expenseAdded' | 'expenseEdited' | 'expenseDeleted';
  expenseId: string;
  description: string;
  amountCents: number;
  /** The payer first, then everyone sharing it. */
  members: Member[];
};

export type PaymentChange = {
  kind: 'paymentRecorded' | 'paymentDeleted';
  paymentId: string;
  amountCents: number;
  from: Member;
  to: Member;
};

export type ActivityDraft = {
  actor: Member;
  change: ActivityChange;
};

export type ActivityEntry = ActivityDraft & {
  id: string;
  createdAtMillis: number;
};

export type Viewer = { kind: 'onlooker' } | { kind: 'member'; member: Member };
