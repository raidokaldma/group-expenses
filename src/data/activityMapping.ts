import { serverTimestamp, type DocumentData } from 'firebase/firestore';
import type { ActivityChange, ActivityEntry, ActivityDraft, Member } from '../shared/types';
import { isRecord, loggedMember, text, timestampMillis, uniqueLoggedMembers, wholeNumber } from './readFields';

export type ReadActivity = { kind: 'readable'; entry: ActivityEntry } | { kind: 'unreadable' };

export function activityToDocument(draft: ActivityDraft): DocumentData {
  return { createdAt: serverTimestamp(), actor: draft.actor, change: draft.change };
}

export function activityFromDocument(id: string, data: DocumentData): ReadActivity {
  const change = changeFromDocument(isRecord(data.change) ? data.change : {});
  if (change.kind === 'unknown') return { kind: 'unreadable' };
  return {
    kind: 'readable',
    entry: { id, createdAtMillis: timestampMillis(data.createdAt), actor: loggedMember(data.actor), change: change.change },
  };
}

type ReadChange = { kind: 'known'; change: ActivityChange } | { kind: 'unknown' };

function changeFromDocument(data: Record<string, unknown>): ReadChange {
  const known = (change: ActivityChange): ReadChange => ({ kind: 'known', change });
  const member = (): Member => loggedMember(data.member);
  switch (data.kind) {
    case 'groupCreated':
    case 'memberJoined':
      return known({ kind: data.kind });
    case 'groupRenamed':
      return known({ kind: data.kind, name: text(data.name) });
    case 'memberAdded':
    case 'memberRemoved':
      return known({ kind: data.kind, member: member() });
    case 'memberRenamed':
      return known({ kind: data.kind, member: member(), previousName: text(data.previousName) });
    case 'expenseAdded':
    case 'expenseEdited':
    case 'expenseDeleted':
      return known({
        kind: data.kind,
        expenseId: text(data.expenseId),
        description: text(data.description),
        amountCents: wholeNumber(data.amountCents),
        members: uniqueLoggedMembers(data.members),
      });
    case 'paymentRecorded':
    case 'paymentDeleted':
      return known({
        kind: data.kind,
        paymentId: text(data.paymentId),
        amountCents: wholeNumber(data.amountCents),
        from: loggedMember(data.from),
        to: loggedMember(data.to),
      });
    default:
      return { kind: 'unknown' };
  }
}
